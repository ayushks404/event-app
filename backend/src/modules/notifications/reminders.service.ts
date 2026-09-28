import { pool } from '../../config/db';

export async function generateReminders(userId?: string) {
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, event_id, booking_id, dedupe_key)
     SELECT b.user_id, 'EVENT_REMINDER', 'Event starting soon',
            e.name || ' starts within 24 hours', e.id, b.id, 'reminder:' || b.id
       FROM bookings b JOIN events e ON e.id = b.event_id
      WHERE b.status = 'confirmed' AND e.status = 'active'
        AND ($1::uuid IS NULL OR b.user_id = $1)
        AND (e.date + e.start_time) BETWEEN (now() AT TIME ZONE 'Asia/Kolkata')
                                        AND (now() AT TIME ZONE 'Asia/Kolkata') + interval '24 hours'
     ON CONFLICT (dedupe_key) DO NOTHING`,
    [userId ?? null]
  );
}
