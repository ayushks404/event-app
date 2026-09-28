import { ApiOne } from '../types/api';
import { AttendeeDTO, DashboardDTO, OrganizerEventDTO } from '../types/models';
import { api } from './api';

export const organizerService = {
  async dashboard() {
    const res = await api.get<ApiOne<DashboardDTO>>('/organizer/dashboard');
    return res.data.data;
  },

  async events() {
    const res = await api.get<ApiOne<OrganizerEventDTO[]>>('/organizer/events');
    return res.data.data;
  },

  async attendees(eventId: string, q?: string) {
    const params = q ? { q } : {};
    const res = await api.get<ApiOne<AttendeeDTO[]>>(`/organizer/events/${eventId}/attendees`, { params });
    return res.data.data;
  },
};
