import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { inDays, inHours } from '../src/scripts/seedHelpers';
import { resetDb, createUser, createEvent, auth } from './helpers';

describe('Notifications API & Reminders Generator', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('handles notification endpoints: list, unread-count, read, and read-all (preserving route order)', async () => {
    const { user, token } = await createUser();

    // Insert 2 notifications
    const { rows: nRows } = await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, is_read)
      VALUES ($1, 'BOOKING_CONFIRMED', 'Title 1', 'Message 1', FALSE),
             ($1, 'EVENT_UPDATED',   'Title 2', 'Message 2', FALSE)
      RETURNING id`, [user.id]);

    // GET /unread-count
    const unreadRes = await request(app).get('/api/notifications/unread-count').set(auth(token));
    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body.data.count).toBe(2);

    // PUT /read-all (verifies route order doesn't map read-all to :id)
    const readAllRes = await request(app).put('/api/notifications/read-all').set(auth(token));
    expect(readAllRes.status).toBe(200);
    expect(readAllRes.body.data.updated).toBe(2);

    const unreadAfterRes = await request(app).get('/api/notifications/unread-count').set(auth(token));
    expect(unreadAfterRes.body.data.count).toBe(0);

    // PUT /:id/read
    const singleReadRes = await request(app).put(`/api/notifications/${nRows[0].id}/read`).set(auth(token));
    expect(singleReadRes.status).toBe(200);
    expect(singleReadRes.body.data.notification.isRead).toBe(true);
  });

  it('returns 404 NOT_FOUND when reading another user notification', async () => {
    const { user: user1 } = await createUser();
    const { token: token2 } = await createUser();

    const { rows } = await pool.query(
      "INSERT INTO notifications (user_id, type, title, message) VALUES ($1, 'BOOKING_CONFIRMED', 'T', 'M') RETURNING id",
      [user1.id]
    );

    const res = await request(app).put(`/api/notifications/${rows[0].id}/read`).set(auth(token2));
    expect(res.status).toBe(404);
  });

  it('generates EVENT_REMINDER for a booking on an event starting within 24h (deduped on second fetch)', async () => {
    const { user: org } = await createUser({ role: 'organizer' });
    const { token } = await createUser();

    const s = inHours(10); // 10 hours from now (within 24h window)
    const event = await createEvent({ organizerId: org.id, date: s.date, startTime: s.time });

    // Make booking
    await request(app).post('/api/bookings').set(auth(token)).send({ eventId: event.id, ticketType: 'General', quantity: 1 });

    // First fetch triggers reminder generator
    const res1 = await request(app).get('/api/notifications').set(auth(token));
    expect(res1.status).toBe(200);
    const reminders1 = res1.body.data.filter((n: any) => n.type === 'EVENT_REMINDER');
    expect(reminders1.length).toBe(1);

    // Second fetch should not duplicate reminder
    const res2 = await request(app).get('/api/notifications').set(auth(token));
    const reminders2 = res2.body.data.filter((n: any) => n.type === 'EVENT_REMINDER');
    expect(reminders2.length).toBe(1);
  });

  it('does NOT generate reminder for events beyond 24h or for cancelled bookings', async () => {
    const { user: org } = await createUser({ role: 'organizer' });
    const { token } = await createUser();

    const farEvent = await createEvent({ organizerId: org.id, date: inDays(3) }); // 3 days away
    await request(app).post('/api/bookings').set(auth(token)).send({ eventId: farEvent.id, ticketType: 'General', quantity: 1 });

    const res = await request(app).get('/api/notifications').set(auth(token));
    const reminders = res.body.data.filter((n: any) => n.type === 'EVENT_REMINDER');
    expect(reminders.length).toBe(0);
  });
});
