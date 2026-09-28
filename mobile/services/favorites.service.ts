import { ApiOne } from '../types/api';
import { EventSummaryDTO } from '../types/models';
import { api } from './api';

export const favoritesService = {
  async list() {
    const res = await api.get<ApiOne<EventSummaryDTO[]>>('/favorites');
    return res.data.data;
  },

  async add(eventId: string) {
    const res = await api.post<ApiOne<{ eventId: string; isFavorite: boolean }>>('/favorites', { eventId });
    return res.data.data;
  },

  async remove(eventId: string) {
    await api.delete(`/favorites/${eventId}`);
  },
};
