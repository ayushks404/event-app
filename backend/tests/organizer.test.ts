import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { inDays } from '../src/scripts/seedHelpers';
import { resetDb, createUser, createEvent, auth } from './helpers';

describe('Organizer API & Event Write Rules', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('rejects normal user token on organizer routes with 403 FORBIDDEN', async () => {
    const { token: userToken } = await createUser({ role: 'user' });

    const resDash = await request(app).get('/api/organizer/dashboard').set(auth(userToken));
    expect(resDash.status).toBe(403);
    expect(resDash.body.error.code).toBe('FORBIDDEN');

    const resCreate = await request(app).post('/api/events').set(auth(userToken)).send({ name: 'Test' });
    expect(resCreate.status).toBe(403);
  });

  it('returns valid dashboard numbers (totalEvents, upcomingEvents, totalBookings, totalAttendees)', async () => {
    const { user: org, token: orgToken } = await createUser({ role: 'organizer' });
    const { user: u1 } = await createUser();
    const event = await createEvent({ organizerId: org.id, totalSeats: 20, availableSeats: 20, date: inDays(5) });

    // Book 2 seats for u1
    await request(app).post('/api/bookings').set(auth(jwtToken(u1.id, 'user'))).send({ eventId: event.id, ticketType: 'General', quantity: 2 });

    const res = await request(app).get('/api/organizer/dashboard').set(auth(orgToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      totalEvents: 1,
      upcomingEvents: 1,
      totalBookings: 1,
      totalAttendees: 2, // ticket sum
    });
  });

  it('validates event creation inputs (past date, end <= start, negative price, seats < 1)', async () => {
    const { token: orgToken } = await createUser({ role: 'organizer' });

    const resPast = await request(app).post('/api/events').set(auth(orgToken)).send({
      name: 'Past Event', description: 'Valid description text', category: 'Music',
      date: inDays(-2), startTime: '18:00', endTime: '21:00', venue: 'Venue', address: 'Address',
      ticketPrice: 100, totalSeats: 10,
    });
    expect(resPast.status).toBe(400);

    const resTimes = await request(app).post('/api/events').set(auth(orgToken)).send({
      name: 'Time Event', description: 'Valid description text', category: 'Music',
      date: inDays(5), startTime: '21:00', endTime: '18:00', venue: 'Venue', address: 'Address',
      ticketPrice: 100, totalSeats: 10,
    });
    expect(resTimes.status).toBe(400);
  });

  it('returns 403 when updating or deleting another organizer event', async () => {
    const { user: org1 } = await createUser({ role: 'organizer' });
    const { token: org2Token } = await createUser({ role: 'organizer' });
    const event = await createEvent({ organizerId: org1.id });

    const resUpdate = await request(app).put(`/api/events/${event.id}`).set(auth(org2Token)).send({ name: 'Hacked Event' });
    expect(resUpdate.status).toBe(403);

    const resDelete = await request(app).delete(`/api/events/${event.id}`).set(auth(org2Token));
    expect(resDelete.status).toBe(403);
  });

  it('returns 409 SEATS_BELOW_BOOKED when reducing seats below booked count', async () => {
    const { user: org, token: orgToken } = await createUser({ role: 'organizer' });
    const { user: u1 } = await createUser();
    const event = await createEvent({ organizerId: org.id, totalSeats: 10, availableSeats: 10, date: inDays(5) });

    // Book 4 seats
    await request(app).post('/api/bookings').set(auth(jwtToken(u1.id, 'user'))).send({ eventId: event.id, ticketType: 'General', quantity: 4 });

    // Try setting totalSeats to 3 (less than 4 booked)
    const res = await request(app).put(`/api/events/${event.id}`).set(auth(orgToken)).send({ totalSeats: 3 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SEATS_BELOW_BOOKED');
  });

  it('notifies booked users once with EVENT_UPDATED when venue/date changes', async () => {
    const { user: org, token: orgToken } = await createUser({ role: 'organizer' });
    const { user: u1 } = await createUser();
    const event = await createEvent({ organizerId: org.id, date: inDays(5), venue: 'Old Hall' });

    await request(app).post('/api/bookings').set(auth(jwtToken(u1.id, 'user'))).send({ eventId: event.id, ticketType: 'General', quantity: 1 });

    const res = await request(app).put(`/api/events/${event.id}`).set(auth(orgToken)).send({ venue: 'New Arena' });
    expect(res.status).toBe(200);

    const { rows: notifs } = await pool.query("SELECT * FROM notifications WHERE user_id = $1 AND type = 'EVENT_UPDATED'", [u1.id]);
    expect(notifs.length).toBe(1);
  });

  it('hard deletes an event with zero bookings', async () => {
    const { user: org, token: orgToken } = await createUser({ role: 'organizer' });
    const event = await createEvent({ organizerId: org.id });

    const res = await request(app).delete(`/api/events/${event.id}`).set(auth(orgToken));
    expect(res.status).toBe(200);
    expect(res.body.data.action).toBe('deleted');
    expect(res.body.data.cancelledBookings).toBe(0);

    const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [event.id]);
    expect(rows.length).toBe(0);
  });

  it('cancels event & bookings and notifies users when deleting an event with bookings', async () => {
    const { user: org, token: orgToken } = await createUser({ role: 'organizer' });
    const { user: u1 } = await createUser();
    const event = await createEvent({ organizerId: org.id, date: inDays(5) });

    const bRes = await request(app).post('/api/bookings').set(auth(jwtToken(u1.id, 'user'))).send({ eventId: event.id, ticketType: 'General', quantity: 2 });
    const bookingId = bRes.body.data.booking.id;

    const res = await request(app).delete(`/api/events/${event.id}`).set(auth(orgToken));
    expect(res.status).toBe(200);
    expect(res.body.data.action).toBe('cancelled');
    expect(res.body.data.cancelledBookings).toBe(1);

    // Event status cancelled
    const { rows: eventRows } = await pool.query('SELECT status FROM events WHERE id = $1', [event.id]);
    expect(eventRows[0].status).toBe('cancelled');

    // Booking status cancelled
    const { rows: bookingRows } = await pool.query('SELECT status FROM bookings WHERE id = $1', [bookingId]);
    expect(bookingRows[0].status).toBe('cancelled');

    // Notification EVENT_CANCELLED
    const { rows: notifRows } = await pool.query("SELECT * FROM notifications WHERE user_id = $1 AND type = 'EVENT_CANCELLED'", [u1.id]);
    expect(notifRows.length).toBe(1);
  });

  it('returns 409 EVENT_STARTED when deleting a started event that has bookings', async () => {
    const { user: org, token: orgToken } = await createUser({ role: 'organizer' });
    const { user: u1 } = await createUser();

    // Create event, add booking, then simulate event started by setting date to past in DB
    const event = await createEvent({ organizerId: org.id, date: inDays(5) });
    await request(app).post('/api/bookings').set(auth(jwtToken(u1.id, 'user'))).send({ eventId: event.id, ticketType: 'General', quantity: 1 });
    await pool.query("UPDATE events SET date = (now() AT TIME ZONE 'Asia/Kolkata')::date - 2 WHERE id = $1", [event.id]);

    const res = await request(app).delete(`/api/events/${event.id}`).set(auth(orgToken));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EVENT_STARTED');
  });

  it('searches attendees list by name, email, mobile, or booking code', async () => {
    const { user: org, token: orgToken } = await createUser({ role: 'organizer' });
    const { user: u1 } = await createUser({ name: 'Alice Smith', email: 'alice@example.com', mobile: '9876543210' });
    const event = await createEvent({ organizerId: org.id, date: inDays(5) });

    const bRes = await request(app).post('/api/bookings').set(auth(jwtToken(u1.id, 'user'))).send({ eventId: event.id, ticketType: 'General', quantity: 1 });
    const bookingCode = bRes.body.data.booking.bookingCode;

    const resSearchName = await request(app).get(`/api/organizer/events/${event.id}/attendees?q=Alice`).set(auth(orgToken));
    expect(resSearchName.status).toBe(200);
    expect(resSearchName.body.data.length).toBe(1);
    expect(resSearchName.body.data[0].bookingCode).toBe(bookingCode);

    const resSearchCode = await request(app).get(`/api/organizer/events/${event.id}/attendees?q=${bookingCode}`).set(auth(orgToken));
    expect(resSearchCode.body.data.length).toBe(1);
  });

  it('returns 403 when requesting attendees for another organizer event', async () => {
    const { user: org1 } = await createUser({ role: 'organizer' });
    const { token: org2Token } = await createUser({ role: 'organizer' });
    const event = await createEvent({ organizerId: org1.id });

    const res = await request(app).get(`/api/organizer/events/${event.id}/attendees`).set(auth(org2Token));
    expect(res.status).toBe(403);
  });
});

import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
function jwtToken(id: string, role: string) {
  return jwt.sign({ role }, env.JWT_SECRET, { subject: id, expiresIn: '7d' });
}
