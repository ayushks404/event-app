import { pool } from '../../config/db';
import { EventSummaryDTO } from '../../types/dto';
import { AppError } from '../../utils/AppError';
import { toEventSummaryDTO } from '../../utils/mappers';
import { favoritesRepo } from './favorites.repo';

export const favoritesService = {
  async add(userId: string, eventId: string): Promise<{ eventId: string; isFavorite: boolean }> {
    const exists = await favoritesRepo.add(pool, userId, eventId);
    if (!exists) {
      throw new AppError(404, 'NOT_FOUND', 'Event not found');
    }
    return { eventId, isFavorite: true };
  },

  async list(userId: string): Promise<EventSummaryDTO[]> {
    const rows = await favoritesRepo.list(pool, userId);
    return rows.map(r => ({ ...toEventSummaryDTO(r), isFavorite: true }));
  },

  async remove(userId: string, eventId: string): Promise<void> {
    await favoritesRepo.remove(pool, userId, eventId);
  },
};
