import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { pool } from '../../config/db';
import { Role, UserDTO } from '../../types/dto';
import { AppError } from '../../utils/AppError';
import { toUserDTO } from '../../utils/mappers';
import { authRepo } from './auth.repo';
import { registerSchema, loginSchema, updateProfileSchema } from './auth.schema';
import { z } from 'zod';

const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-safety', 10);

function signToken(userId: string, role: Role): string {
  const options: SignOptions = {
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign({ role }, env.JWT_SECRET, options);
}

export const authService = {
  async register(input: z.infer<typeof registerSchema>): Promise<{ user: UserDTO; token: string }> {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const userRow = await authRepo.create(pool, {
      name: input.name,
      email: input.email,
      mobile: input.mobile,
      passwordHash,
      role: input.role,
    });
    const token = signToken(userRow.id, userRow.role);
    return { user: toUserDTO(userRow), token };
  },

  async login(input: z.infer<typeof loginSchema>): Promise<{ user: UserDTO; token: string }> {
    const userRow = await authRepo.findByEmail(pool, input.email);
    const isValid = await bcrypt.compare(input.password, userRow?.password ?? DUMMY_HASH);
    if (!userRow || !isValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    const token = signToken(userRow.id, userRow.role);
    return { user: toUserDTO(userRow), token };
  },

  async getMe(userId: string): Promise<UserDTO> {
    const userRow = await authRepo.findById(pool, userId);
    if (!userRow) {
      throw new AppError(401, 'UNAUTHENTICATED', 'User no longer exists');
    }
    return toUserDTO(userRow);
  },

  async updateMe(userId: string, input: z.infer<typeof updateProfileSchema>): Promise<UserDTO> {
    const userRow = await authRepo.update(pool, userId, input);
    if (!userRow) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }
    return toUserDTO(userRow);
  },
};
