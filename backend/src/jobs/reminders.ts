import cron from 'node-cron';
import { generateReminders } from '../modules/notifications/reminders.service';
import { logger } from '../utils/logger';

export function startReminderJob() {
  // Runs hourly at minute 0
  return cron.schedule('0 * * * *', () => {
    generateReminders().catch((err) => {
      logger.error('Error running hourly reminder job:', err);
    });
  });
}
