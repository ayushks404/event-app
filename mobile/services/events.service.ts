import { ApiList, ApiOne } from '../types/api';
import { EventDetailDTO, EventFilters, EventSummaryDTO } from '../types/models';
import { api } from './api';

export const eventsService = {
  async list(params?: EventFilters & { page?: number; limit?: number; featured?: boolean }) {
    // Only send non-empty params
    const cleanParams: Record<string, any> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '' && value !== null) {
          cleanParams[key] = value;
        }
      }
    }
    const res = await api.get<ApiList<EventSummaryDTO>>('/events', { params: cleanParams });
    return { items: res.data.data, meta: res.data.meta };
  },

  async detail(id: string) {
    const res = await api.get<ApiOne<EventDetailDTO>>(`/events/${id}`);
    return res.data.data;
  },

  async create(data: any) {
    const res = await api.post<ApiOne<EventDetailDTO>>('/events', data);
    return res.data.data;
  },

  async update(id: string, data: any) {
    const res = await api.put<ApiOne<EventDetailDTO>>(`/events/${id}`, data);
    return res.data.data;
  },

  async remove(id: string) {
    const res = await api.delete<ApiOne<{ action: 'deleted' | 'cancelled'; cancelledBookings: number }>>(`/events/${id}`);
    return res.data.data;
  },
};
