import { PoolClient } from 'pg';
import { Db } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { genCode } from '../../utils/bookingCode';
import { BookingRow } from '../../utils/mappers';
import { fromPaise } from '../../utils/money';

export const BOOKING_COLUMNS = `
  b.*, e.name AS event_name, e.image AS event_image, e.category AS event_category,
  e.date AS event_date, e.start_time AS event_start_time, e.end_time AS event_end_time,
  e.venue AS event_venue, e.address AS event_address, e.status AS event_status,
  e.available_seats AS event_available_seats,
  u.name AS user_name, u.email AS user_email, u.mobile AS user_mobile`;

export const BOOKING_FROM = `
  FROM bookings b
  JOIN events e ON e.id = b.event_id
  JOIN users  u ON u.id = b.user_id`;

export const BOOKING_SELECT = `SELECT ${BOOKING_COLUMNS} ${BOOKING_FROM}`;

export interface NewBooking {
  userId: string;
  eventId: string;
  ticketType: 'General' | 'VIP';
  quantity: number;
  unit: number;
  fee: number;
  tax: number;
  total: number;
}

export async function insertBookingWithCode(c: PoolClient, b: NewBooking) {
  for (let i = 0; i < 5; i++) {
    const { rows } = await c.query(
      `INSERT INTO bookings (booking_code, user_id, event_id, ticket_type, quantity,
                             unit_price, service_fee, tax_amount, total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (booking_code) DO NOTHING
       RETURNING *`,
      [genCode(), b.userId, b.eventId, b.ticketType, b.quantity,
       fromPaise(b.unit), fromPaise(b.fee), fromPaise(b.tax), fromPaise(b.total)]
    );
    if (rows[0]) return rows[0];
  }
  throw new AppError(500, 'INTERNAL_ERROR', 'Could not allocate booking code');
}

export const bookingsRepo = {
  async findOwned(db: Db, id: string, userId: string): Promise<BookingRow | null> {
    const { rows } = await db.query(
      `${BOOKING_SELECT} WHERE b.id = $1 AND b.user_id = $2`,
      [id, userId]
    );
    return rows[0] || null;
  },

  async list(db: Db, userId: string, tab: string, page: number, limit: number): Promise<{ rows: (BookingRow & { total_count: number })[] }> {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT ${BOOKING_COLUMNS}, COUNT(*) OVER() AS total_count
      ${BOOKING_FROM}
      WHERE b.user_id = $1
        AND CASE $2::text
              WHEN 'upcoming'  THEN b.status = 'confirmed' AND (e.date + e.start_time) >  (now() AT TIME ZONE 'Asia/Kolkata')
              WHEN 'completed' THEN b.status = 'confirmed' AND (e.date + e.start_time) <= (now() AT TIME ZONE 'Asia/Kolkata')
              WHEN 'cancelled' THEN b.status = 'cancelled'
              ELSE TRUE END
      ORDER BY CASE WHEN $2::text = 'upcoming'  THEN (e.date + e.start_time) END ASC,
               CASE WHEN $2::text <> 'upcoming' THEN (e.date + e.start_time) END DESC
      LIMIT $3 OFFSET $4`;
    const { rows } = await db.query(sql, [userId, tab, limit, offset]);
    return { rows };
  },
};
