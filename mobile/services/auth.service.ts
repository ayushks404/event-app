import { ApiOne } from '../types/api';
import { Role, UserDTO } from '../types/models';
import { api } from './api';

export const authService = {
  async register(data: { name: string; email: string; mobile: string; password: string; confirmPassword: string; role?: Role }) {
    const res = await api.post<ApiOne<{ user: UserDTO; token: string }>>('/auth/register', data);
    return res.data.data;
  },

  async login(email: string, password: string) {
    const res = await api.post<ApiOne<{ user: UserDTO; token: string }>>('/auth/login', { email, password });
    return res.data.data;
  },

  async me() {
    const res = await api.get<ApiOne<{ user: UserDTO }>>('/auth/me');
    return res.data.data.user;
  },

  async updateMe(patch: { name?: string; mobile?: string }) {
    const res = await api.put<ApiOne<{ user: UserDTO }>>('/auth/me', patch);
    return res.data.data.user;
  },
};
