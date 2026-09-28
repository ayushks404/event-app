import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { inDays } from '../src/scripts/seedHelpers';
import { resetDb, createUser, createEvent, auth } from './helpers';

describe('Events and Favorites API', () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe('GET /api/events', () => {
    it('lists active future events and excludes past and cancelled events', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      await createEvent({ organizerId: org.id, name: 'Future Event', date: inDays(5) });
      await createEvent({ organizerId: org.id, name: 'Past Event', date: inDays(-5) });
      await createEvent({ organizerId: org.id, name: 'Cancelled Event', status: 'cancelled' });

      const res = await request(app).get('/api/events');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Future Event');
    });

    it('filters by search term q matching name, organizer, venue, category', async () => {
      const { user: org } = await createUser({ role: 'organizer', name: 'Special Organizer' });
      await createEvent({ organizerId: org.id, name: 'React Summit', category: 'Technology', venue: 'Expo Hall' });
      await createEvent({ organizerId: org.id, name: 'Jazz Night', category: 'Music', venue: 'Blue Note' });

      const resByName = await request(app).get('/api/events?q=React');
      expect(resByName.body.data.length).toBe(1);
      expect(resByName.body.data[0].name).toBe('React Summit');

      const resByOrg = await request(app).get('/api/events?q=Special');
      expect(resByOrg.body.data.length).toBe(2);

      const resByVenue = await request(app).get('/api/events?q=Blue Note');
      expect(resByVenue.body.data.length).toBe(1);
      expect(resByVenue.body.data[0].name).toBe('Jazz Night');
    });

    it('handles special characters in q (e.g. 50%) without wildcard expansion', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      await createEvent({ organizerId: org.id, name: 'Event with 50% discount' });
      await createEvent({ organizerId: org.id, name: 'Regular Event 100' });

      const res = await request(app).get('/api/events?q=50%25');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Event with 50% discount');
    });

    it('supports pagination meta (hasMore)', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      for (let i = 1; i <= 3; i++) {
        await createEvent({ organizerId: org.id, name: `Event ${i}` });
      }

      const res = await request(app).get('/api/events?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.hasMore).toBe(true);

      const resPage2 = await request(app).get('/api/events?page=2&limit=2');
      expect(resPage2.body.data.length).toBe(1);
      expect(resPage2.body.meta.hasMore).toBe(false);
    });

    it('featured=true returns top <= 5 events and excludes sold out events', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      await createEvent({ organizerId: org.id, name: 'Sold Out', totalSeats: 10, availableSeats: 0 });
      await createEvent({ organizerId: org.id, name: 'Popular', totalSeats: 100, availableSeats: 10 });
      await createEvent({ organizerId: org.id, name: 'Fresh', totalSeats: 100, availableSeats: 90 });

      const res = await request(app).get('/api/events?featured=true');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].name).toBe('Popular'); // higher fill rate
      expect(res.body.meta.hasMore).toBe(false);
    });
  });

  describe('GET /api/events/:id', () => {
    it('returns event detail with ticketTiers and pricing', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const event = await createEvent({ organizerId: org.id, ticketPrice: 1000 });

      const res = await request(app).get(`/api/events/${event.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.ticketTiers).toEqual([
        { type: 'General', unitPrice: 1000 },
        { type: 'VIP', unitPrice: 2000 },
      ]);
      expect(res.body.data.pricing).toEqual({
        feeBps: 500,
        taxBps: 1800,
        maxQuantity: 10,
      });
    });

    it('returns 400 for invalid UUID parameter', async () => {
      const res = await request(app).get('/api/events/not-a-uuid');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 for non-existent event ID', async () => {
      const res = await request(app).get('/api/events/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Favorites API', () => {
    it('allows adding, listing, and removing favorites idempotently', async () => {
      const { user: org } = await createUser({ role: 'organizer' });
      const { token } = await createUser();
      const event = await createEvent({ organizerId: org.id });

      // Add favorite
      const addRes1 = await request(app).post('/api/favorites').set(auth(token)).send({ eventId: event.id });
      expect(addRes1.status).toBe(200);
      expect(addRes1.body.data.isFavorite).toBe(true);

      // Add favorite second time (idempotent)
      const addRes2 = await request(app).post('/api/favorites').set(auth(token)).send({ eventId: event.id });
      expect(addRes2.status).toBe(200);

      // List favorites
      const listRes = await request(app).get('/api/favorites').set(auth(token));
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(1);
      expect(listRes.body.data[0].id).toBe(event.id);
      expect(listRes.body.data[0].isFavorite).toBe(true);

      // Check event listing reflects isFavorite flag when auth token is passed
      const eventListRes = await request(app).get('/api/events').set(auth(token));
      expect(eventListRes.body.data[0].isFavorite).toBe(true);

      // Remove favorite
      const removeRes = await request(app).delete(`/api/favorites/${event.id}`).set(auth(token));
      expect(removeRes.status).toBe(204);

      // List after remove
      const listAfterRes = await request(app).get('/api/favorites').set(auth(token));
      expect(listAfterRes.body.data.length).toBe(0);
    });
  });
});
