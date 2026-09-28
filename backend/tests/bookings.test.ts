import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { inDays, inHours } from '../src/scripts/seedHelpers';
import * as bookingCodeModule from '../src/utils/bookingCode';
import { resetDb, createUser, createEvent, auth } from './helpers';

describe('Bookings API', () => {
  beforeEach(async () => {
    await resetDb();
    vi.restoreAllMocks();
  });

  describe('POST /api/bookings', () => {
    it('creates booking (201), decreases available seats, computes totals, and creates notification', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { user, token } = await createUser();
      const event = await createEvent({ organizerId: org.id, ticketPrice: 500, totalSeats: 10, availableSeats: 10 });

      const res = await request(app)
        .post('/api/bookings')
        .set(auth(token))
        .send({ eventId: event.id, ticketType: 'VIP', quantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const b = res.body.data.booking;
      expect(b.ticketType).toBe('VIP');
      expect(b.quantity).toBe(2);
      expect(b.unitPrice).toBe(1000); // 500 * 2
      expect(b.subtotal).toBe(2000);
      expect(b.serviceFee).toBe(100);  // 5% of 2000
      expect(b.taxAmount).toBe(378);   // 18% of 2100
      expect(b.totalAmount).toBe(2478);

      // Verify seats decreased in DB
      const { rows: eventRows } = await pool.query('SELECT available_seats FROM events WHERE id = $1', [event.id]);
      expect(eventRows[0].available_seats).toBe(8);

      // Verify notification created
      const { rows: notifRows } = await pool.query('SELECT * FROM notifications WHERE user_id = $1', [user.id]);
      expect(notifRows.length).toBe(1);
      expect(notifRows[0].type).toBe('BOOKING_CONFIRMED');
    });

    it('ignores client-sent price/fee totals and computes server-side', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { token } = await createUser();
      const event = await createEvent({ organizerId: org.id, ticketPrice: 100 });

      const res = await request(app)
        .post('/api/bookings')
        .set(auth(token))
        .send({ eventId: event.id, ticketType: 'General', quantity: 1, totalAmount: 1 }); // client sends fake 1

      expect(res.status).toBe(201);
      expect(res.body.data.booking.totalAmount).toBe(123.9); // 100 + 5 + 18.9 = 123.9
    });

    it('returns 400 for invalid quantities (0 or 11)', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { token } = await createUser();
      const event = await createEvent({ organizerId: org.id });

      const res0 = await request(app).post('/api/bookings').set(auth(token)).send({ eventId: event.id, ticketType: 'General', quantity: 0 });
      expect(res0.status).toBe(400);

      const res11 = await request(app).post('/api/bookings').set(auth(token)).send({ eventId: event.id, ticketType: 'General', quantity: 11 });
      expect(res11.status).toBe(400);
    });

    it('returns 409 SOLD_OUT when event has 0 seats left', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { token } = await createUser();
      const event = await createEvent({ organizerId: org.id, totalSeats: 5, availableSeats: 0 });

      const res = await request(app).post('/api/bookings').set(auth(token)).send({ eventId: event.id, ticketType: 'General', quantity: 1 });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('SOLD_OUT');
    });

    it('returns 409 INSUFFICIENT_SEATS when requesting more seats than available', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { token } = await createUser();
      const event = await createEvent({ organizerId: org.id, totalSeats: 5, availableSeats: 2 });

      const res = await request(app).post('/api/bookings').set(auth(token)).send({ eventId: event.id, ticketType: 'General', quantity: 3 });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('INSUFFICIENT_SEATS');
    });

    it('returns 409 EVENT_CANCELLED when booking a cancelled event', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { token } = await createUser();
      const event = await createEvent({ organizerId: org.id, status: 'cancelled' });

      const res = await request(app).post('/api/bookings').set(auth(token)).send({ eventId: event.id, ticketType: 'General', quantity: 1 });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EVENT_CANCELLED');
    });

    it('returns 409 EVENT_STARTED when booking an event that has already started', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { token } = await createUser();
      const event = await createEvent({ organizerId: org.id, date: inDays(-1) });

      const res = await request(app).post('/api/bookings').set(auth(token)).send({ eventId: event.id, ticketType: 'General', quantity: 1 });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EVENT_STARTED');
    });

    it('returns 403 FORBIDDEN when organizer tries to book their own event (seats unchanged)', async () => {
      const { user: org, token: orgToken } = await createUser({ role: 'organizer' });
      const event = await createEvent({ organizerId: org.id, totalSeats: 10, availableSeats: 10 });

      const res = await request(app).post('/api/bookings').set(auth(orgToken)).send({ eventId: event.id, ticketType: 'General', quantity: 2 });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');

      const { rows } = await pool.query('SELECT available_seats FROM events WHERE id = $1', [event.id]);
      expect(rows[0].available_seats).toBe(10);
    });

    it('handles booking code collisions gracefully using code retry', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { token } = await createUser();
      const event = await createEvent({ organizerId: org.id, totalSeats: 10, availableSeats: 10 });

      let calls = 0;
      vi.spyOn(bookingCodeModule, 'genCode').mockImplementation(() => {
        calls++;
        if (calls <= 2) return 'EVT-DUPLICATE';
        return `EVT-UNIQUE${calls}`;
      });

      // First booking gets EVT-DUPLICATE
      const res1 = await request(app).post('/api/bookings').set(auth(token)).send({ eventId: event.id, ticketType: 'General', quantity: 1 });
      expect(res1.status).toBe(201);
      expect(res1.body.data.booking.bookingCode).toBe('EVT-DUPLICATE');

      // Second booking tries EVT-DUPLICATE (call 2), collides, retries (call 3), gets EVT-UNIQUE3
      const res2 = await request(app).post('/api/bookings').set(auth(token)).send({ eventId: event.id, ticketType: 'General', quantity: 1 });
      expect(res2.status).toBe(201);
      expect(res2.body.data.booking.bookingCode).toBe('EVT-UNIQUE3');

      const { rows } = await pool.query('SELECT available_seats FROM events WHERE id = $1', [event.id]);
      expect(rows[0].available_seats).toBe(8);
    });
  });

  describe('GET /api/bookings and tabs', () => {
    it('classifies bookings correctly by tab (upcoming / completed / cancelled)', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { user, token } = await createUser();

      const futureEvt = await createEvent({ organizerId: org.id, date: inDays(5) });
      const pastEvt = await createEvent({ organizerId: org.id, date: inDays(-5) });

      // Upcoming booking
      const bUpcoming = await request(app).post('/api/bookings').set(auth(token)).send({ eventId: futureEvt.id, ticketType: 'General', quantity: 1 });
      // Direct insert past booking (completed)
      await pool.query(
        `INSERT INTO bookings (booking_code, user_id, event_id, ticket_type, quantity, unit_price, service_fee, tax_amount, total_amount, status)
         VALUES ('EVT-PAST', $1, $2, 'General', 1, 500, 25, 94.5, 619.5, 'confirmed')`,
        [user.id, pastEvt.id]
      );

      // Fetch upcoming tab
      const resUpcoming = await request(app).get('/api/bookings?tab=upcoming').set(auth(token));
      expect(resUpcoming.status).toBe(200);
      expect(resUpcoming.body.data.length).toBe(1);
      expect(resUpcoming.body.data[0].id).toBe(bUpcoming.body.data.booking.id);

      // Fetch completed tab
      const resCompleted = await request(app).get('/api/bookings?tab=completed').set(auth(token));
      expect(resCompleted.status).toBe(200);
      expect(resCompleted.body.data.length).toBe(1);
      expect(resCompleted.body.data[0].bookingCode).toBe('EVT-PAST');

      // Cancel upcoming and verify in cancelled tab
      await request(app).put(`/api/bookings/${bUpcoming.body.data.booking.id}/cancel`).set(auth(token));
      const resCancelled = await request(app).get('/api/bookings?tab=cancelled').set(auth(token));
      expect(resCancelled.status).toBe(200);
      expect(resCancelled.body.data.length).toBe(1);
      expect(resCancelled.body.data[0].id).toBe(bUpcoming.body.data.booking.id);
    });
  });

  describe('PUT /api/bookings/:id/cancel', () => {
    it('cancels booking, restores seats, and creates notification', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { user, token } = await createUser();
      const event = await createEvent({ organizerId: org.id, totalSeats: 10, availableSeats: 8, date: inDays(5) });

      const bRes = await request(app).post('/api/bookings').set(auth(token)).send({ eventId: event.id, ticketType: 'General', quantity: 2 });
      const bookingId = bRes.body.data.booking.id;

      const res = await request(app).put(`/api/bookings/${bookingId}/cancel`).set(auth(token));
      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('cancelled');

      // Seats restored
      const { rows: eventRows } = await pool.query('SELECT available_seats FROM events WHERE id = $1', [event.id]);
      expect(eventRows[0].available_seats).toBe(8);

      // Notification created
      const { rows: notifRows } = await pool.query("SELECT * FROM notifications WHERE user_id = $1 AND type = 'BOOKING_CANCELLED'", [user.id]);
      expect(notifRows.length).toBe(1);
    });

    it('returns 409 ALREADY_CANCELLED on second cancel attempt and restores seats ONCE', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { token } = await createUser();
      const event = await createEvent({ organizerId: org.id, totalSeats: 10, availableSeats: 10, date: inDays(5) });

      const bRes = await request(app).post('/api/bookings').set(auth(token)).send({ eventId: event.id, ticketType: 'General', quantity: 2 });
      const bookingId = bRes.body.data.booking.id;

      await request(app).put(`/api/bookings/${bookingId}/cancel`).set(auth(token));
      const secondCancel = await request(app).put(`/api/bookings/${bookingId}/cancel`).set(auth(token));

      expect(secondCancel.status).toBe(409);
      expect(secondCancel.body.error.code).toBe('ALREADY_CANCELLED');

      const { rows } = await pool.query('SELECT available_seats FROM events WHERE id = $1', [event.id]);
      expect(rows[0].available_seats).toBe(10); // restored back to 10 once, not 12
    });

    it('returns 409 CANCELLATION_CLOSED when cancelling within 2 hours of start time', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { token } = await createUser();
      const s = inHours(1); // 1 hour from now
      const event = await createEvent({ organizerId: org.id, date: s.date, startTime: s.time });

      const bRes = await request(app).post('/api/bookings').set(auth(token)).send({ eventId: event.id, ticketType: 'General', quantity: 1 });
      const bookingId = bRes.body.data.booking.id;

      const res = await request(app).put(`/api/bookings/${bookingId}/cancel`).set(auth(token));
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CANCELLATION_CLOSED');
    });

    it('returns 404 NOT_FOUND when getting or cancelling another user booking', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { token: token1 } = await createUser();
      const { token: token2 } = await createUser();
      const event = await createEvent({ organizerId: org.id, date: inDays(5) });

      const bRes = await request(app).post('/api/bookings').set(auth(token1)).send({ eventId: event.id, ticketType: 'General', quantity: 1 });
      const bookingId = bRes.body.data.booking.id;

      const getRes = await request(app).get(`/api/bookings/${bookingId}`).set(auth(token2));
      expect(getRes.status).toBe(404);

      const cancelRes = await request(app).put(`/api/bookings/${bookingId}/cancel`).set(auth(token2));
      expect(cancelRes.status).toBe(404);
    });
  });
});
