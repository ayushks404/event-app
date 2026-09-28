import { Db } from '../../config/db';
import { NotificationRow } from '../../utils/mappers';

export const notificationsRepo = {
  async list(db: Db, userId: string, page: number, limit: number): Promise<{ rows: (NotificationRow & { total_count: number })[] }> {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT *, COUNT(*) OVER() AS total_count
        FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`;
    const { rows } = await db.query(sql, [userId, limit, offset]);
    return { rows };
  },

  async unreadCount(db: Db, userId: string): Promise<number> {
    const sql = `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`;
    const { rows } = await db.query(sql, [userId]);
    return Number(rows[0].count);
  },

  async markRead(db: Db, id: string, userId: string): Promise<NotificationRow | null> {
    const sql = `
      UPDATE notifications
         SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
      RETURNING *`;
    const { rows } = await db.query(sql, [id, userId]);
    return rows[0] || null;
  },

  async markAllRead(db: Db, userId: string): Promise<number> {
    const sql = `
      UPDATE notifications
         SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE
      RETURNING id`;
    const { rows } = await db.query(sql, [userId]);
    return rows.length;
  },
};
