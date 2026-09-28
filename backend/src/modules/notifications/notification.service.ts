import { Db } from '../../config/db';
import { NotificationDTO } from '../../types/dto';

export async function notify(db: Db, userId: string, n: {
  type: NotificationDTO['type'];
  title: string;
  message: string;
  eventId?: string | null;
  bookingId?: string | null;
  dedupeKey?: string | null;
}) {
  await db.query(
    `INSERT INTO notifications (user_id, type, title, message, event_id, booking_id, dedupe_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (dedupe_key) DO NOTHING`,
    [userId, n.type, n.title, n.message, n.eventId ?? null, n.bookingId ?? null, n.dedupeKey ?? null]
  );
}
