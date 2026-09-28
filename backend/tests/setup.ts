import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://eventapp:eventapp@localhost:5432/eventapp_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-test-secret-test-secret-12';
process.env.JWT_EXPIRES_IN = '7d';
