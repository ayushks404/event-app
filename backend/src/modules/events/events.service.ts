import { z } from 'zod';
import { pool, withTx } from '../../config/db';
import { EventDetailDTO, EventSummaryDTO, Meta } from '../../types/dto';
import { AppError } from '../../utils/AppError';
import { eventStart, hasStarted } from '../../utils/dates';
import { toEventDetailDTO, toEventSummaryDTO } from '../../utils/mappers';
import { eventsRepo, ListEventsFilter } from './events.repo';
import { createEventSchema, updateEventSchema } from './events.schema';

export const eventsService = {
  async list(userId: string | null, filters: ListEventsFilter): Promise<{ items: EventSummaryDTO[]; meta: Meta }> {
    const { rows } = await eventsRepo.list(pool, userId, filters);
    const total = rows[0]?.total_count ?? 0;
    const page = filters.featured ? 1 : filters.page;
    const limit = filters.featured ? 5 : filters.limit;
    const hasMore = filters.featured ? false : page * limit < total;

    const items = rows.map(r => toEventSummaryDTO(r));
    return {
      items,
      meta: {
        page,
        limit,
        total: Number(total),
        hasMore,
      },
    };
  },

  async detail(id: string, userId: string | null): Promise<EventDetailDTO> {
    const row = await eventsRepo.findById(pool, id, userId);
    if (!row) {
      throw new AppError(404, 'NOT_FOUND', 'Event not found');
    }
    return toEventDetailDTO(row);
  },

  async create(organizerId: string, input: z.infer<typeof createEventSchema>): Promise<EventDetailDTO> {
    if (eventStart(input.date, input.startTime).getTime() <= Date.now()) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Event start time must be in the future', {
        date: ['Date and start time must be in the future'],
      });
    }

    const image = input.image && input.image.trim() !== '' ? input.image.trim() : null;

    const { rows } = await pool.query(
      `INSERT INTO events (
        organizer_id, name, description, category, image, date, start_time, end_time,
        venue, address, ticket_price, total_seats, available_seats, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,'active')
      RETURNING *`,
      [
        organizerId, input.name, input.description, input.category, image,
        input.date, input.startTime, input.endTime, input.venue, input.address,
        input.ticketPrice, input.totalSeats,
      ]
    );

    const created = await eventsRepo.findById(pool, rows[0].id, organizerId);
    return toEventDetailDTO(created!);
  },

  async update(organizerId: string, id: string, input: z.infer<typeof updateEventSchema>): Promise<EventDetailDTO> {
    return withTx(async (c) => {
      const { rows: existingRows } = await c.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [id]);
      const existing = existingRows[0];
      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Event not found');
      }
      if (existing.organizer_id !== organizerId) {
        throw new AppError(403, 'FORBIDDEN', 'You do not have permission to modify this event');
      }
      if (existing.status === 'cancelled') {
        throw new AppError(409, 'EVENT_CANCELLED', 'This event was cancelled');
      }
      if (hasStarted(existing)) {
        throw new AppError(409, 'EVENT_STARTED', 'Cannot modify an event that has already started');
      }

      const mergedDate = input.date ?? existing.date;
      const mergedStart = input.startTime ?? existing.start_time.slice(0, 5);
      const mergedEnd = input.endTime ?? existing.end_time.slice(0, 5);

      if (mergedEnd <= mergedStart) {
        throw new AppError(400, 'VALIDATION_ERROR', 'End time must be after start time', {
          endTime: ['End time must be after start time'],
        });
      }

      if (eventStart(mergedDate, mergedStart).getTime() <= Date.now()) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Event start time must be in the future', {
          date: ['Date and start time must be in the future'],
        });
      }

      const oldTotal = Number(existing.total_seats);
      const oldAvailable = Number(existing.available_seats);
      const booked = oldTotal - oldAvailable;

      let newTotal = oldTotal;
      let newAvailable = oldAvailable;

      if (input.totalSeats !== undefined) {
        if (input.totalSeats < booked) {
          throw new AppError(409, 'SEATS_BELOW_BOOKED', `Cannot reduce total seats below ${booked} seats already booked`);
        }
        newTotal = input.totalSeats;
        newAvailable = newTotal - booked;
      }

      const image = input.image !== undefined
        ? (input.image && input.image.trim() !== '' ? input.image.trim() : null)
        : existing.image;

      await c.query(
        `UPDATE events
            SET name = COALESCE($2, name),
                description = COALESCE($3, description),
                category = COALESCE($4, category),
                image = $5,
                date = COALESCE($6, date),
                start_time = COALESCE($7, start_time),
                end_time = COALESCE($8, end_time),
                venue = COALESCE($9, venue),
                address = COALESCE($10, address),
                ticket_price = COALESCE($11, ticket_price),
                total_seats = $12,
                available_seats = $13
          WHERE id = $1`,
        [
          id, input.name ?? null, input.description ?? null, input.category ?? null, image,
          input.date ?? null, input.startTime ?? null, input.endTime ?? null,
          input.venue ?? null, input.address ?? null, input.ticketPrice ?? null,
          newTotal, newAvailable,
        ]
      );

      // Check if location or time details changed
      const dateChanged = input.date !== undefined && input.date !== existing.date;
      const startChanged = input.startTime !== undefined && input.startTime !== existing.start_time.slice(0, 5);
      const endChanged = input.endTime !== undefined && input.endTime !== existing.end_time.slice(0, 5);
      const venueChanged = input.venue !== undefined && input.venue !== existing.venue;
      const addressChanged = input.address !== undefined && input.address !== existing.address;

      if (dateChanged || startChanged || endChanged || venueChanged || addressChanged) {
        await c.query(
          `INSERT INTO notifications (user_id, type, title, message, event_id, booking_id)
           SELECT DISTINCT ON (b.user_id) b.user_id, 'EVENT_UPDATED', 'Event updated',
                  e.name || ' has updated details. Please review the date, time and venue.', e.id, b.id
             FROM bookings b JOIN events e ON e.id = b.event_id
            WHERE b.event_id = $1 AND b.status = 'confirmed'
            ORDER BY b.user_id, b.created_at`,
          [id]
        );
      }

      const updatedRow = await eventsRepo.findById(c, id, organizerId);
      return toEventDetailDTO(updatedRow!);
    });
  },

  async delete(organizerId: string, id: string): Promise<{ action: 'deleted' | 'cancelled'; cancelledBookings: number }> {
    return withTx(async (c) => {
      const { rows: existingRows } = await c.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [id]);
      const existing = existingRows[0];
      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Event not found');
      }
      if (existing.organizer_id !== organizerId) {
        throw new AppError(403, 'FORBIDDEN', 'You do not have permission to modify this event');
      }

      const { rows: bookingCountRows } = await c.query('SELECT COUNT(*) FROM bookings WHERE event_id = $1', [id]);
      const totalBookings = Number(bookingCountRows[0].count);

      if (totalBookings === 0) {
        await c.query('DELETE FROM events WHERE id = $1', [id]);
        return { action: 'deleted', cancelledBookings: 0 };
      }

      if (existing.status === 'cancelled') {
        return { action: 'cancelled', cancelledBookings: 0 };
      }

      if (hasStarted(existing)) {
        throw new AppError(409, 'EVENT_STARTED', 'Cannot cancel an event that has already started');
      }

      // Notify confirmed users first
      await c.query(
        `INSERT INTO notifications (user_id, type, title, message, event_id, booking_id, dedupe_key)
         SELECT DISTINCT ON (b.user_id) b.user_id, 'EVENT_CANCELLED', 'Event cancelled',
                e.name || ' has been cancelled by the organizer.', e.id, b.id, 'event-cancelled:' || b.id
           FROM bookings b JOIN events e ON e.id = b.event_id
          WHERE b.event_id = $1 AND b.status = 'confirmed'
          ORDER BY b.user_id, b.created_at
         ON CONFLICT (dedupe_key) DO NOTHING`,
        [id]
      );

      const { rows: cancelledRows } = await c.query(
        `UPDATE bookings SET status = 'cancelled', cancelled_at = now() WHERE event_id = $1 AND status = 'confirmed' RETURNING id`,
        [id]
      );

      await c.query(`UPDATE events SET status = 'cancelled', available_seats = total_seats WHERE id = $1`, [id]);

      return { action: 'cancelled', cancelledBookings: cancelledRows.length };
    });
  },
};
