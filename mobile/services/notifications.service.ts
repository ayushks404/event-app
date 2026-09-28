import { ApiList, ApiOne } from '../types/api';
import { NotificationDTO } from '../types/models';
import { api } from './api';

export const notificationsService = {
  async list(page = 1, limit = 10) {
    const res = await api.get<ApiList<NotificationDTO>>('/notifications', { params: { page, limit } });
    return { items: res.data.data, meta: res.data.meta };
  },

  async unreadCount() {
    const res = await api.get<ApiOne<{ count: number }>>('/notifications/unread-count');
    return res.data.data.count;
  },

  async markRead(id: string) {
    const res = await api.put<ApiOne<{ notification: NotificationDTO }>>(`/notifications/${id}/read`);
    return res.data.data.notification;
  },

  async markAllRead() {
    const res = await api.put<ApiOne<{ updated: number }>>('/notifications/read-all');
    return res.data.data.updated;
  },
};
