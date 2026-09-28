import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { inDays } from '../src/scripts/seedHelpers';
import { resetDb, createUser, createEvent, auth } from './helpers';

describe('Booking Concurrency Test', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('handles 20 parallel bookings on an event with 5 seats: exactly 5 succeed (201) and 15 fail (409)', async () => {
    const { user: org } = await createUser({ role: 'organizer' });
    const event = await createEvent({ organizerId: org.id, totalSeats: 5, availableSeats: 5, date: inDays(10) });

    // Create 20 distinct users & tokens
    const users = await Promise.all(Array.from({ length: 20 }, () => createUser()));

    // Dispatch 20 parallel booking requests
    const promises = users.map(({ token }) =>
      request(app)
        .post('/api/bookings')
        .set(auth(token))
        .send({ eventId: event.id, ticketType: 'General', quantity: 1 })
    );

    const results = await Promise.all(promises);

    const successCount = results.filter(r => r.status === 201).length;
    const failCount = results.filter(r => r.status === 409).length;

    expect(successCount).toBe(5);
    expect(failCount).toBe(15);

    // Verify DB state
    const { rows: eventRows } = await pool.query('SELECT available_seats FROM events WHERE id = $1', [event.id]);
    expect(eventRows[0].available_seats).toBe(0);

    const { rows: bookingRows } = await pool.query('SELECT COUNT(*) FROM bookings WHERE event_id = $1 AND status = \'confirmed\'', [event.id]);
    expect(Number(bookingRows[0].count)).toBe(5);
  });
});
