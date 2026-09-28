import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { env } from '../src/config/env';
import { resetDb, createUser, auth } from './helpers';

describe('Auth API', () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user successfully (201)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          mobile: '9876543210',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'user',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('john@example.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('returns 409 EMAIL_TAKEN when registering duplicate email with different case', async () => {
      await createUser({ email: 'john@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Copy',
          email: 'JOHN@EXAMPLE.COM',
          mobile: '9876543211',
          password: 'Password123',
          confirmPassword: 'Password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
      expect(res.body.error.details.email).toBeDefined();
    });

    it('returns 400 VALIDATION_ERROR with details for invalid fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'J',
          email: 'invalid-email',
          mobile: '12345',
          password: 'weak',
          confirmPassword: 'other',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in successfully with valid credentials', async () => {
      const { user } = await createUser({ email: 'user@example.com' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'Test@1234',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(user.id);
      expect(res.body.data.token).toBeDefined();
    });

    it('returns same 401 INVALID_CREDENTIALS for wrong password and unknown email', async () => {
      await createUser({ email: 'existing@example.com' });

      const resWrongPassword = await request(app)
        .post('/api/auth/login')
        .send({ email: 'existing@example.com', password: 'WrongPassword1' });

      const resUnknownEmail = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown@example.com', password: 'Test@1234' });

      expect(resWrongPassword.status).toBe(401);
      expect(resWrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');

      expect(resUnknownEmail.status).toBe(401);
      expect(resUnknownEmail.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(resWrongPassword.body.error.message).toBe(resUnknownEmail.body.error.message);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns user details when authenticated', async () => {
      const { user, token } = await createUser();

      const res = await request(app)
        .get('/api/auth/me')
        .set(auth(token));

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(user.id);
    });

    it('returns 401 UNAUTHENTICATED when token is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 401 TOKEN_EXPIRED when token is expired', async () => {
      const { user } = await createUser();
      const expiredToken = jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: '-1s' });

      const res = await request(app)
        .get('/api/auth/me')
        .set(auth(expiredToken));

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('PUT /api/auth/me', () => {
    it('updates user profile successfully', async () => {
      const { token } = await createUser();

      const res = await request(app)
        .put('/api/auth/me')
        .set(auth(token))
        .send({ name: 'Updated Name', mobile: '9876543299' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Updated Name');
      expect(res.body.data.user.mobile).toBe('9876543299');
    });
  });
});
