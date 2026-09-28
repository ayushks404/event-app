import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { apiRouter } from './routes';
import { AppError } from './utils/AppError';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '1mb' }));
if (env.NODE_ENV !== 'test') app.use(morgan('tiny'));
app.use('/api', apiRouter);
app.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found')));
app.use(errorHandler);

export default app;
