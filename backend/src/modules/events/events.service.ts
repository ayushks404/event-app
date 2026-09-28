import { pool } from '../../config/db';
import { EventDetailDTO, EventSummaryDTO, Meta } from '../../types/dto';
import { AppError } from '../../utils/AppError';
import { toEventDetailDTO, toEventSummaryDTO } from '../../utils/mappers';
import { eventsRepo, ListEventsFilter } from './events.repo';

export const eventsService = {
  async list(userId: string | null, filters: ListEventsFilter): Promise<{ items: EventSummaryDTO[]; meta: Meta }> {
    const { rows } = await eventsRepo.list(pool, userId, filters);
    const total = rows[0]?.total_count ?? 0;
    const page = filters.featured ? 1 : filters.page;
    const limit = filters.featured ? 5 : filters.limit;
    const hasMore = filters.featured ? false : page * limit < total;

    const items = rows.map(r => toEventSummaryDTO(r));
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

  async detail(id: string, userId: string | null): Promise<EventDetailDTO> {
    const row = await eventsRepo.findById(pool, id, userId);
    if (!row) {
      throw new AppError(404, 'NOT_FOUND', 'Event not found');
    }
    return toEventDetailDTO(row);
  },
};
