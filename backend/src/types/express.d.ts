import type { Role } from './dto';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- parsed by zod in validate(); controllers cast to their schema type
      valid: { body: any; query: any; params: any };
    }
  }
}

export {};
