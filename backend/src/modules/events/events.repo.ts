import { Db } from '../../config/db';
import { likePattern } from '../../utils/like';
import { EventRow } from '../../utils/mappers';

export interface ListEventsFilter {
  q?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  featured?: boolean;
  sort: 'date' | 'price' | 'popularity';
  page: number;
  limit: number;
}

const SORTS = {
  date: 'e.date ASC, e.start_time ASC',
  price: 'e.ticket_price ASC, e.date ASC, e.start_time ASC',
  popularity: '(e.total_seats - e.available_seats)::float / e.total_seats DESC, e.date ASC, e.start_time ASC',
} as const;

export const eventsRepo = {
  async list(db: Db, userId: string | null, f: ListEventsFilter): Promise<{ rows: (EventRow & { total_count: number })[] }> {
    if (f.featured) {
      const sql = `
        SELECT e.*, u.name AS organizer_name,
               EXISTS (SELECT 1 FROM favorites f WHERE f.event_id = e.id AND f.user_id = $1::uuid) AS is_favorite,
               COUNT(*) OVER() AS total_count
          FROM events e JOIN users u ON u.id = e.organizer_id
         WHERE e.status = 'active'
           AND (e.date + e.start_time) > (now() AT TIME ZONE 'Asia/Kolkata')
           AND e.available_seats > 0
         ORDER BY (e.total_seats - e.available_seats)::float / e.total_seats DESC, e.date ASC, e.start_time ASC
         LIMIT 5`;
      const { rows } = await db.query(sql, [userId]);
      return { rows };
    }

    const sortClause = SORTS[f.sort] || SORTS.date;
    const offset = (f.page - 1) * f.limit;
    const qPattern = likePattern(f.q);
    const locPattern = likePattern(f.location);

    const sql = `
      SELECT e.*, u.name AS organizer_name,
             EXISTS (SELECT 1 FROM favorites f WHERE f.event_id = e.id AND f.user_id = $1::uuid) AS is_favorite,
             COUNT(*) OVER() AS total_count
        FROM events e JOIN users u ON u.id = e.organizer_id
       WHERE e.status = 'active'
         AND (e.date + e.start_time) > (now() AT TIME ZONE 'Asia/Kolkata')
         AND ($2::text IS NULL OR e.name ILIKE $2 ESCAPE '\\' OR u.name ILIKE $2 ESCAPE '\\' OR e.venue ILIKE $2 ESCAPE '\\' OR e.address ILIKE $2 ESCAPE '\\' OR e.category ILIKE $2 ESCAPE '\\')
         AND ($3::text IS NULL OR e.category = $3)
         AND ($4::date IS NULL OR e.date >= $4::date)
         AND ($5::date IS NULL OR e.date <= $5::date)
         AND ($6::text IS NULL OR e.venue ILIKE $6 ESCAPE '\\' OR e.address ILIKE $6 ESCAPE '\\')
         AND ($7::numeric IS NULL OR e.ticket_price >= $7)
         AND ($8::numeric IS NULL OR e.ticket_price <= $8)
         AND ($9::boolean IS NOT TRUE OR e.available_seats > 0)
       ORDER BY ${sortClause}
       LIMIT $10 OFFSET $11`;

    const params = [
      userId,
      qPattern,
      f.category ?? null,
      f.dateFrom ?? null,
      f.dateTo ?? null,
      locPattern,
      f.minPrice ?? null,
      f.maxPrice ?? null,
      f.available ?? null,
      f.limit,
      offset,
    ];

    const { rows } = await db.query(sql, params);
    return { rows };
  },

  async findById(db: Db, id: string, userId: string | null): Promise<EventRow | null> {
    const sql = `
      SELECT e.*, u.name AS organizer_name,
             EXISTS (SELECT 1 FROM favorites f WHERE f.event_id = e.id AND f.user_id = $1::uuid) AS is_favorite
        FROM events e JOIN users u ON u.id = e.organizer_id
       WHERE e.id = $2`;
    const { rows } = await db.query(sql, [userId, id]);
    return rows[0] || null;
  },
};
