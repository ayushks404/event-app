import dotenv from 'dotenv';
import { runMigrations } from '../src/scripts/migrate';

export default async function globalSetup() {
  dotenv.config();
  const testDbUrl = process.env.TEST_DATABASE_URL ?? 'postgres://eventapp:eventapp@localhost:5432/eventapp_test';
  await runMigrations(testDbUrl);
}
