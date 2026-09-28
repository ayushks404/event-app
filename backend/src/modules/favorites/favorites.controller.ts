import { RequestHandler } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { favoritesService } from './favorites.service';

export const addFavoriteHandler: RequestHandler = asyncHandler(async (req, res) => {
  const result = await favoritesService.add(req.user!.id, req.valid.body.eventId);
  res.json({ success: true, data: result });
});

export const listFavoritesHandler: RequestHandler = asyncHandler(async (req, res) => {
  const items = await favoritesService.list(req.user!.id);
  res.json({ success: true, data: items });
});

export const removeFavoriteHandler: RequestHandler = asyncHandler(async (req, res) => {
  await favoritesService.remove(req.user!.id, req.valid.params.eventId);
  res.status(204).send();
});
