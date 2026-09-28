import { Db } from '../../config/db';
import { EventRow } from '../../utils/mappers';

export const favoritesRepo = {
  async add(db: Db, userId: string, eventId: string): Promise<boolean> {
    const { rows: eventCheck } = await db.query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (eventCheck.length === 0) {
      return false;
    }
    await db.query(
      `INSERT INTO favorites (user_id, event_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [userId, eventId]
    );
    return true;
  },

  async list(db: Db, userId: string): Promise<EventRow[]> {
    const sql = `
      SELECT e.*, u.name AS organizer_name, TRUE AS is_favorite
        FROM favorites f
        JOIN events e ON e.id = f.event_id
        JOIN users u  ON u.id = e.organizer_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`;
    const { rows } = await db.query(sql, [userId]);
    return rows;
  },

  async remove(db: Db, userId: string, eventId: string): Promise<void> {
    await db.query(`DELETE FROM favorites WHERE user_id = $1 AND event_id = $2`, [userId, eventId]);
  },
};
