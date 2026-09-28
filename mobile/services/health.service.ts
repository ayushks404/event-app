import { api } from './api';

export const healthService = {
  async ping() {
    const res = await api.get<{ status: string; time: string }>('/health');
    return res.data;
  },
};
