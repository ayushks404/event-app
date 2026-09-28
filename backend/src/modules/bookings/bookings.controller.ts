import { RequestHandler } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { bookingsService } from './bookings.service';

export const createBookingHandler: RequestHandler = asyncHandler(async (req, res) => {
  const booking = await bookingsService.createBooking(req.user!.id, req.valid.body);
  res.status(201).json({ success: true, data: { booking } });
});

export const listBookingsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const { tab, page, limit } = req.valid.query;
  const { items, meta } = await bookingsService.listBookings(req.user!.id, tab, page, limit);
  res.json({ success: true, data: items, meta });
});

export const getBookingDetailHandler: RequestHandler = asyncHandler(async (req, res) => {
  const booking = await bookingsService.getBookingDetail(req.user!.id, req.valid.params.id);
  res.json({ success: true, data: { booking } });
});

export const cancelBookingHandler: RequestHandler = asyncHandler(async (req, res) => {
  const booking = await bookingsService.cancelBooking(req.user!.id, req.valid.params.id);
  res.json({ success: true, data: { booking } });
});
