import { describe, it, expect, beforeEach } from 'vitest';
import { pool } from '../src/config/db';
import { eventStart, hasStarted } from '../src/utils/dates';
import { inDays } from '../src/scripts/seedHelpers';
import { resetDb, createUser, createEvent } from './helpers';

describe('Dates and PG Types Utility', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('eventStart returns correct UTC instant for IST wall clock time', () => {
    const instant = eventStart('2026-10-20', '18:00');
    expect(instant.toISOString()).toBe('2026-10-20T12:30:00.000Z');
  });

  it('hasStarted identifies future vs past events correctly', () => {
    expect(hasStarted({ date: inDays(5), start_time: '18:00' })).toBe(false);
    expect(hasStarted({ date: inDays(-2), start_time: '18:00' })).toBe(true);
  });

  it('pg type parsers return DATE as YYYY-MM-DD string and COUNT(*) as JS number', async () => {
    const { user } = await createUser();
    await createEvent({ organizerId: user.id, date: '2026-10-20' });

    const { rows } = await pool.query('SELECT date, COUNT(*) FROM events GROUP BY date');
    expect(rows[0].date).toBe('2026-10-20');
    expect(typeof rows[0].date).toBe('string');
    expect(rows[0].count).toBe(1);
    expect(typeof rows[0].count).toBe('number');
  });
});
