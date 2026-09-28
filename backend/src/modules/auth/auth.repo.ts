import { Db, pool } from '../../config/db';
import { Role } from '../../types/dto';
import { UserRow } from '../../utils/mappers';

export interface CreateUserInput {
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: Role;
}

export const authRepo = {
  async create(db: Db, input: CreateUserInput): Promise<UserRow> {
    const { rows } = await db.query(
      `INSERT INTO users (name, email, mobile, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, mobile, role, created_at`,
      [input.name, input.email, input.mobile, input.passwordHash, input.role]
    );
    return rows[0];
  },

  async findByEmail(db: Db, email: string): Promise<UserRow | null> {
    const { rows } = await db.query(
      `SELECT id, name, email, mobile, password, role, created_at
       FROM users WHERE lower(email) = lower($1)`,
      [email]
    );
    return rows[0] || null;
  },

  async findById(db: Db, id: string): Promise<UserRow | null> {
    const { rows } = await db.query(
      `SELECT id, name, email, mobile, role, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async update(db: Db, id: string, patch: { name?: string; mobile?: string }): Promise<UserRow | null> {
    const { rows } = await db.query(
      `UPDATE users
          SET name = COALESCE($2, name),
              mobile = COALESCE($3, mobile)
        WHERE id = $1
       RETURNING id, name, email, mobile, role, created_at`,
      [id, patch.name ?? null, patch.mobile ?? null]
    );
    return rows[0] || null;
  },
};
