import { Db } from '../../config/db';
import { likePattern } from '../../utils/like';
import { AttendeeRow, EventRow } from '../../utils/mappers';

export const organizerRepo = {
  async getDashboard(db: Db, organizerId: string) {
    const sql = `
      SELECT COUNT(*) AS total_events,
             COUNT(*) FILTER (WHERE e.status = 'active'
                                AND (e.date + e.start_time) > (now() AT TIME ZONE 'Asia/Kolkata')) AS upcoming_events,
             COALESCE(SUM(b.cnt), 0)   AS total_bookings,
             COALESCE(SUM(b.seats), 0) AS total_attendees
        FROM events e
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS cnt, SUM(quantity) AS seats
            FROM bookings WHERE event_id = e.id AND status = 'confirmed'
        ) b ON TRUE
       WHERE e.organizer_id = $1`;
    const { rows } = await db.query(sql, [organizerId]);
    const r = rows[0];
    return {
      totalEvents: Number(r.total_events || 0),
      upcomingEvents: Number(r.upcoming_events || 0),
      totalBookings: Number(r.total_bookings || 0),
      totalAttendees: Number(r.total_attendees || 0),
    };
  },

  async getOwnEvents(db: Db, organizerId: string): Promise<EventRow[]> {
    const sql = `
      SELECT e.*, u.name AS organizer_name,
             (SELECT COUNT(*) FROM bookings b WHERE b.event_id = e.id AND b.status = 'confirmed') AS bookings_count
        FROM events e JOIN users u ON u.id = e.organizer_id
       WHERE e.organizer_id = $1
       ORDER BY e.date DESC, e.start_time DESC`;
    const { rows } = await db.query(sql, [organizerId]);
    return rows;
  },

  async getAttendees(db: Db, eventId: string, query?: string): Promise<AttendeeRow[]> {
    const qPattern = likePattern(query);
    const sql = `
      SELECT b.id AS booking_id, b.booking_code, b.quantity, b.ticket_type, b.status, b.total_amount, b.created_at,
             u.name, u.email, u.mobile
        FROM bookings b JOIN users u ON u.id = b.user_id
       WHERE b.event_id = $1
         AND ($2::text IS NULL OR u.name ILIKE $2 ESCAPE '\\' OR u.email ILIKE $2 ESCAPE '\\' OR u.mobile ILIKE $2 ESCAPE '\\' OR b.booking_code ILIKE $2 ESCAPE '\\')
       ORDER BY b.created_at DESC
       LIMIT 500`;
    const { rows } = await db.query(sql, [eventId, qPattern]);
    return rows;
  },
};
