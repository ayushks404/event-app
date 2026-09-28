import { pool } from '../../config/db';
import { AttendeeDTO, DashboardDTO, OrganizerEventDTO } from '../../types/dto';
import { AppError } from '../../utils/AppError';
import { toAttendeeDTO, toOrganizerEventDTO } from '../../utils/mappers';
import { organizerRepo } from './organizer.repo';

export const organizerService = {
  async getDashboard(organizerId: string): Promise<DashboardDTO> {
    return organizerRepo.getDashboard(pool, organizerId);
  },

  async getOwnEvents(organizerId: string): Promise<OrganizerEventDTO[]> {
    const rows = await organizerRepo.getOwnEvents(pool, organizerId);
    return rows.map(r => toOrganizerEventDTO(r));
  },

  async getAttendees(organizerId: string, eventId: string, query?: string): Promise<AttendeeDTO[]> {
    const { rows: eventRows } = await pool.query('SELECT organizer_id FROM events WHERE id = $1', [eventId]);
    const event = eventRows[0];
    if (!event) {
      throw new AppError(404, 'NOT_FOUND', 'Event not found');
    }
    if (event.organizer_id !== organizerId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to view attendees for this event');
    }

    const rows = await organizerRepo.getAttendees(pool, eventId, query);
    return rows.map(r => toAttendeeDTO(r));
  },
};
