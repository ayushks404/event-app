import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../src/config/db';
import { env } from '../src/config/env';
import { Category, Role } from '../src/types/dto';
import { inDays } from '../src/scripts/seedHelpers';

export async function resetDb() {
  await pool.query('TRUNCATE notifications, favorites, bookings, events, users RESTART IDENTITY CASCADE');
}

let userSeq = 1;
export async function createUser(opts: { role?: Role; email?: string; name?: string; mobile?: string } = {}) {
  userSeq++;
  const role = opts.role ?? 'user';
  const email = opts.email ?? `testuser${userSeq}@example.com`;
  const name = opts.name ?? `Test User ${userSeq}`;
  const mobile = opts.mobile ?? `987${String(userSeq).padStart(7, '0')}`;
  const passwordHash = await bcrypt.hash('Test@1234', 4);

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, mobile, password, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, mobile, role, created_at`,
    [name, email, mobile, passwordHash, role]
  );
  const user = rows[0];
  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: '7d' });
  return { user, token };
}

let eventSeq = 1;
export async function createEvent(opts: {
  organizerId: string;
  name?: string;
  description?: string;
  category?: Category;
  date?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  address?: string;
  ticketPrice?: number;
  totalSeats?: number;
  availableSeats?: number;
  status?: 'active' | 'cancelled';
}) {
  eventSeq++;
  const name = opts.name ?? `Test Event ${eventSeq}`;
  const description = opts.description ?? 'Detailed description for test event';
  const category = opts.category ?? 'Technology';
  const date = opts.date ?? inDays(7);
  const startTime = opts.startTime ?? '18:00';
  const endTime = opts.endTime ?? '21:00';
  const venue = opts.venue ?? 'Test Convention Center';
  const address = opts.address ?? '123 Test Street, City';
  const ticketPrice = opts.ticketPrice ?? 500;
  const totalSeats = opts.totalSeats ?? 50;
  const availableSeats = opts.availableSeats ?? totalSeats;
  const status = opts.status ?? 'active';
  const image = `https://picsum.photos/seed/test-${eventSeq}/800/450`;

  const { rows } = await pool.query(
    `INSERT INTO events (
      organizer_id, name, description, category, image, date, start_time, end_time,
      venue, address, ticket_price, total_seats, available_seats, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING *`,
    [
      opts.organizerId, name, description, category, image, date, startTime, endTime,
      venue, address, ticketPrice, totalSeats, availableSeats, status
    ]
  );
  return rows[0];
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}
