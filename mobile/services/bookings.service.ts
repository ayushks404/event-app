import { ApiList, ApiOne } from '../types/api';
import { BookingDTO, TicketType } from '../types/models';
import { api } from './api';

export const bookingsService = {
  async create(data: { eventId: string; ticketType: TicketType; quantity: number }) {
    const res = await api.post<ApiOne<{ booking: BookingDTO }>>('/bookings', data);
    return res.data.data.booking;
  },

  async list(tab: 'upcoming' | 'completed' | 'cancelled' = 'upcoming', page = 1, limit = 10) {
    const res = await api.get<ApiList<BookingDTO>>('/bookings', { params: { tab, page, limit } });
    return { items: res.data.data, meta: res.data.meta };
  },

  async get(id: string) {
    const res = await api.get<ApiOne<{ booking: BookingDTO }>>(`/bookings/${id}`);
    return res.data.data.booking;
  },

  async cancel(id: string) {
    const res = await api.put<ApiOne<{ booking: BookingDTO }>>(`/bookings/${id}/cancel`);
    return res.data.data.booking;
  },
};
