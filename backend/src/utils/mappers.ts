import { CANCEL_CUTOFF_HOURS, FEE_BPS, MAX_QTY, TAX_BPS, TIER_MULTIPLIERS } from '../constants/pricing';
import {
  AttendeeDTO,
  BookingDTO,
  Category,
  EventDetailDTO,
  EventSummaryDTO,
  NotificationDTO,
  OrganizerEventDTO,
  Role,
  TicketType,
  UserDTO,
} from '../types/dto';
import { hasStarted, hoursUntilStart } from './dates';
import { fromPaise, toPaise } from './money';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password?: string;
  role: Role;
  created_at: Date | string;
}

export interface EventRow {
  id: string;
  organizer_id: string;
  organizer_name?: string;
  name: string;
  description?: string;
  category: Category;
  image: string | null;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  address: string;
  ticket_price: number | string;
  total_seats: number;
  available_seats: number;
  status: 'active' | 'cancelled';
  created_at: Date | string;
  is_favorite?: boolean;
  bookings_count?: number | string;
}

export interface BookingRow {
  id: string;
  booking_code: string;
  user_id: string;
  event_id: string;
  ticket_type: TicketType;
  quantity: number;
  unit_price: number | string;
  service_fee: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  status: 'confirmed' | 'cancelled';
  created_at: Date | string;
  cancelled_at: Date | string | null;

  // Joined event fields
  event_name: string;
  event_image: string | null;
  event_category: Category;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  event_venue: string;
  event_address: string;
  event_status: 'active' | 'cancelled';
  event_available_seats: number;

  // Joined user fields
  user_name?: string;
  user_email?: string;
  user_mobile?: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationDTO['type'];
  title: string;
  message: string;
  event_id: string | null;
  booking_id: string | null;
  is_read: boolean;
  created_at: Date | string;
}

export interface AttendeeRow {
  booking_id: string;
  booking_code: string;
  name: string;
  email: string;
  mobile: string;
  quantity: number;
  ticket_type: TicketType;
  status: 'confirmed' | 'cancelled';
  total_amount: number | string;
  created_at: Date | string;
}

export function toUserDTO(r: UserRow): UserDTO {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    mobile: r.mobile,
    role: r.role,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export function toEventSummaryDTO(r: EventRow): EventSummaryDTO {
  const ev = { date: r.date, start_time: r.start_time };
  const basePrice = Number(r.ticket_price);
  const summary: EventSummaryDTO = {
    id: r.id,
    name: r.name,
    category: r.category,
    image: r.image ?? null,
    date: r.date,
    startTime: r.start_time.slice(0, 5),
    endTime: r.end_time.slice(0, 5),
    venue: r.venue,
    address: r.address,
    ticketPrice: basePrice,
    totalSeats: Number(r.total_seats),
    availableSeats: Number(r.available_seats),
    status: r.status,
    isSoldOut: r.status === 'active' && Number(r.available_seats) === 0,
    hasStarted: hasStarted(ev),
    organizer: {
      id: r.organizer_id,
      name: r.organizer_name || '',
    },
  };
  if (r.is_favorite !== undefined) {
    summary.isFavorite = Boolean(r.is_favorite);
  }
  return summary;
}

export function toEventDetailDTO(r: EventRow): EventDetailDTO {
  const summary = toEventSummaryDTO(r);
  const basePrice = summary.ticketPrice;
  return {
    ...summary,
    description: r.description || '',
    ticketTiers: [
      { type: 'General', unitPrice: Math.round(basePrice * TIER_MULTIPLIERS.General * 100) / 100 },
      { type: 'VIP', unitPrice: Math.round(basePrice * TIER_MULTIPLIERS.VIP * 100) / 100 },
    ],
    pricing: {
      feeBps: FEE_BPS,
      taxBps: TAX_BPS,
      maxQuantity: MAX_QTY,
    },
  };
}

export function toOrganizerEventDTO(r: EventRow): OrganizerEventDTO {
  const summary = toEventSummaryDTO(r);
  const total = summary.totalSeats;
  const avail = summary.availableSeats;
  return {
    ...summary,
    booked: total - avail,
    bookingsCount: Number(r.bookings_count || 0),
  };
}

export function toBookingDTO(r: BookingRow, opts: { withUser?: boolean } = {}): BookingDTO {
  const ev = { date: r.event_date, start_time: r.event_start_time };
  const started = hasStarted(ev);
  const phase = r.status === 'cancelled' ? 'cancelled' : started ? 'completed' : 'upcoming';
  const canCancel = r.status === 'confirmed' && r.event_status === 'active' && hoursUntilStart(ev) >= CANCEL_CUTOFF_HOURS;
  const unitPrice = Number(r.unit_price);
  const subtotal = fromPaise(toPaise(unitPrice) * r.quantity);

  const dto: BookingDTO = {
    id: r.id,
    bookingCode: r.booking_code,
    status: r.status,
    phase,
    canCancel,
    ticketType: r.ticket_type,
    quantity: r.quantity,
    unitPrice,
    subtotal,
    serviceFee: Number(r.service_fee),
    taxAmount: Number(r.tax_amount),
    totalAmount: Number(r.total_amount),
    createdAt: new Date(r.created_at).toISOString(),
    cancelledAt: r.cancelled_at ? new Date(r.cancelled_at).toISOString() : null,
    event: {
      id: r.event_id,
      name: r.event_name,
      image: r.event_image ?? null,
      category: r.event_category,
      date: r.event_date,
      startTime: r.event_start_time.slice(0, 5),
      endTime: r.event_end_time.slice(0, 5),
      venue: r.event_venue,
      address: r.event_address,
      status: r.event_status,
      availableSeats: Number(r.event_available_seats),
    },
  };

  if (opts.withUser && r.user_name) {
    dto.user = {
      id: r.user_id,
      name: r.user_name,
      email: r.user_email || '',
      mobile: r.user_mobile || '',
    };
  }

  return dto;
}

export function toNotificationDTO(r: NotificationRow): NotificationDTO {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message,
    isRead: Boolean(r.is_read),
    createdAt: new Date(r.created_at).toISOString(),
    eventId: r.event_id ?? null,
    bookingId: r.booking_id ?? null,
  };
}

export function toAttendeeDTO(r: AttendeeRow): AttendeeDTO {
  return {
    bookingId: r.booking_id,
    bookingCode: r.booking_code,
    name: r.name,
    email: r.email,
    mobile: r.mobile,
    quantity: r.quantity,
    ticketType: r.ticket_type,
    status: r.status,
    totalAmount: Number(r.total_amount),
    createdAt: new Date(r.created_at).toISOString(),
  };
}
