import app from './app';
import { env } from './config/env';
import { pool } from './config/db';
import { generateReminders } from './modules/notifications/reminders.service';
import { startReminderJob } from './jobs/reminders';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Run reminders generator once on boot
void generateReminders().catch((err) => logger.error('Error generating boot reminders:', err));

// Start cron job
const cronJob = startReminderJob();

const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  cronJob.stop();
  server.close(async () => {
    logger.info('HTTP server closed. Closing database pool...');
    await pool.end();
    logger.info('Database pool closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
