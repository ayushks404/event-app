import { pool, withTx } from '../../config/db';
import { CANCEL_CUTOFF_HOURS } from '../../constants/pricing';
import { BookingDTO, Meta } from '../../types/dto';
import { AppError } from '../../utils/AppError';
import { hasStarted, hoursUntilStart } from '../../utils/dates';
import { toBookingDTO } from '../../utils/mappers';
import { toPaise } from '../../utils/money';
import { notify } from '../notifications/notification.service';
import { BOOKING_SELECT, bookingsRepo, insertBookingWithCode } from './bookings.repo';
import { computeTotals } from './pricing';

export interface CreateBookingInput {
  eventId: string;
  ticketType: 'General' | 'VIP';
  quantity: number;
}

export const bookingsService = {
  async createBooking(userId: string, input: CreateBookingInput): Promise<BookingDTO> {
    return withTx(async (c) => {
      // 1. Atomic seat reservation — the ONLY place seats decrease. No read-then-write.
      const { rows } = await c.query(
        `UPDATE events
            SET available_seats = available_seats - $2
          WHERE id = $1
            AND status = 'active'
            AND available_seats >= $2
            AND (date + start_time) > (now() AT TIME ZONE 'Asia/Kolkata')
        RETURNING *`,
        [input.eventId, input.quantity]
      );

      if (rows.length === 0) { // diagnose why, in this order
        const ev = await c.query(`SELECT available_seats, status, date, start_time FROM events WHERE id = $1`, [input.eventId]);
        const e = ev.rows[0];
        if (!e) throw new AppError(404, 'NOT_FOUND', 'Event not found');
        if (e.status === 'cancelled') throw new AppError(409, 'EVENT_CANCELLED', 'This event was cancelled');
        if (hasStarted(e)) throw new AppError(409, 'EVENT_STARTED', 'Booking is closed for this event');
        if (Number(e.available_seats) === 0) throw new AppError(409, 'SOLD_OUT', 'This event is sold out');
        throw new AppError(409, 'INSUFFICIENT_SEATS', `Only ${e.available_seats} seat(s) left`);
      }
      const event = rows[0];

      // 2. Organizers cannot book their own event (the throw rolls back the seat decrement).
      if (event.organizer_id === userId) {
        throw new AppError(403, 'FORBIDDEN', 'Organizers cannot book their own event');
      }

      // 3. Server-side pricing snapshot from the DB price; ignore any client totals.
      const t = computeTotals(toPaise(event.ticket_price), input.ticketType, input.quantity);

      // 4. Insert booking (code retry via ON CONFLICT DO NOTHING).
      const booking = await insertBookingWithCode(c, {
        userId,
        eventId: event.id,
        ticketType: input.ticketType,
        quantity: input.quantity,
        ...t,
      });

      // 5. Notification in the same transaction.
      await notify(c, userId, {
        type: 'BOOKING_CONFIRMED',
        title: 'Booking confirmed',
        message: `${input.quantity} × ${input.ticketType} ticket(s) for ${event.name}`,
        eventId: event.id,
        bookingId: booking.id,
        dedupeKey: `booked:${booking.id}`,
      });

      // 6. Re-read inside the tx so seat count and joined fields are current.
      const row = await bookingsRepo.findOwned(c, booking.id, userId);
      return toBookingDTO(row!, { withUser: true });
    });
  },

  async cancelBooking(userId: string, bookingId: string): Promise<BookingDTO> {
    return withTx(async (c) => {
      // Lock the booking row: a concurrent second cancel waits, then sees status='cancelled'.
      const { rows } = await c.query(
        `${BOOKING_SELECT} WHERE b.id = $1 AND b.user_id = $2 FOR UPDATE OF b`,
        [bookingId, userId]
      );
      const b = rows[0];
      if (!b) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
      if (b.status === 'cancelled') throw new AppError(409, 'ALREADY_CANCELLED', 'This booking is already cancelled');
      if (hoursUntilStart({ date: b.event_date, start_time: b.event_start_time }) < CANCEL_CUTOFF_HOURS) {
        throw new AppError(409, 'CANCELLATION_CLOSED', `Cancellations close ${CANCEL_CUTOFF_HOURS} hours before the event`);
      }

      await c.query(`UPDATE bookings SET status = 'cancelled', cancelled_at = now() WHERE id = $1`, [bookingId]);
      await c.query(`UPDATE events SET available_seats = LEAST(total_seats, available_seats + $2) WHERE id = $1`, [b.event_id, b.quantity]);
      await notify(c, userId, {
        type: 'BOOKING_CANCELLED',
        title: 'Booking cancelled',
        message: `Your booking ${b.booking_code} for ${b.event_name} was cancelled`,
        eventId: b.event_id,
        bookingId,
        dedupeKey: `cancelled:${bookingId}`,
      });
      const row = await bookingsRepo.findOwned(c, bookingId, userId);
      return toBookingDTO(row!, { withUser: true });
    });
  },

  async listBookings(userId: string, tab: string, page: number, limit: number): Promise<{ items: BookingDTO[]; meta: Meta }> {
    const { rows } = await bookingsRepo.list(pool, userId, tab, page, limit);
    const total = rows[0]?.total_count ?? 0;
    const hasMore = page * limit < Number(total);
    const items = rows.map(r => toBookingDTO(r));
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

  async getBookingDetail(userId: string, bookingId: string): Promise<BookingDTO> {
    const row = await bookingsRepo.findOwned(pool, bookingId, userId);
    if (!row) {
      throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    }
    return toBookingDTO(row, { withUser: true });
  },
};
