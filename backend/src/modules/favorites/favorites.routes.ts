import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { addFavoriteHandler, listFavoritesHandler, removeFavoriteHandler } from './favorites.controller';
import { addFavoriteSchema, removeFavoriteParam } from './favorites.schema';

export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);

favoritesRouter.post('/', validate({ body: addFavoriteSchema }), addFavoriteHandler);
favoritesRouter.get('/', listFavoritesHandler);
favoritesRouter.delete('/:eventId', validate({ params: removeFavoriteParam }), removeFavoriteHandler);
