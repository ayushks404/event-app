import { pool } from '../../config/db';
import { Meta, NotificationDTO } from '../../types/dto';
import { AppError } from '../../utils/AppError';
import { toNotificationDTO } from '../../utils/mappers';
import { notificationsRepo } from './notifications.repo';
import { generateReminders } from './reminders.service';

export const notificationsService = {
  async list(userId: string, page: number, limit: number): Promise<{ items: NotificationDTO[]; meta: Meta }> {
    await generateReminders(userId);
    const { rows } = await notificationsRepo.list(pool, userId, page, limit);
    const total = rows[0]?.total_count ?? 0;
    const hasMore = page * limit < Number(total);
    const items = rows.map(r => toNotificationDTO(r));
    return {
      items,
      meta: {
        page,
        limit,
        total: Number(total),
        hasMore,
      },
    };
  },

  async unreadCount(userId: string): Promise<number> {
    await generateReminders(userId);
    return notificationsRepo.unreadCount(pool, userId);
  },

  async markRead(id: string, userId: string): Promise<NotificationDTO> {
    const row = await notificationsRepo.markRead(pool, id, userId);
    if (!row) {
      throw new AppError(404, 'NOT_FOUND', 'Notification not found');
    }
    return toNotificationDTO(row);
  },

  async markAllRead(userId: string): Promise<number> {
    return notificationsRepo.markAllRead(pool, userId);
  },
};
