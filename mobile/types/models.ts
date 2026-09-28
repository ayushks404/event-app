export type Role = 'user' | 'organizer';
export type Category = 'Music' | 'Sports' | 'Technology' | 'Business' | 'Education' | 'Workshops' | 'Entertainment';
export type TicketType = 'General' | 'VIP';

export interface Meta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: Role;
  createdAt: string;
}

export interface EventSummaryDTO {
  id: string;
  name: string;
  category: Category;
  image: string | null;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  ticketPrice: number;                 // base / "starting from" price in ₹
  totalSeats: number;
  availableSeats: number;
  status: 'active' | 'cancelled';
  isSoldOut: boolean;                  // status==='active' && availableSeats===0
  hasStarted: boolean;
  organizer: { id: string; name: string };
  isFavorite?: boolean;                // present only when a valid token was sent
}

export interface EventDetailDTO extends EventSummaryDTO {
  description: string;
  ticketTiers: { type: TicketType; unitPrice: number }[];
  pricing: { feeBps: number; taxBps: number; maxQuantity: number };
}

export interface OrganizerEventDTO extends EventSummaryDTO {
  booked: number;          // totalSeats - availableSeats
  bookingsCount: number;   // confirmed bookings
}

export interface BookingDTO {
  id: string;
  bookingCode: string;
  status: 'confirmed' | 'cancelled';
  phase: 'upcoming' | 'completed' | 'cancelled';
  canCancel: boolean;
  ticketType: TicketType;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  serviceFee: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  cancelledAt: string | null;
  event: {
    id: string;
    name: string;
    image: string | null;
    category: Category;
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    address: string;
    status: 'active' | 'cancelled';
    availableSeats: number;
  };
  user?: { id: string; name: string; email: string; mobile: string };
}

export interface NotificationDTO {
  id: string;
  type: 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'EVENT_REMINDER' | 'EVENT_UPDATED' | 'EVENT_CANCELLED';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  eventId: string | null;
  bookingId: string | null;
}

export interface AttendeeDTO {
  bookingId: string;
  bookingCode: string;
  name: string;
  email: string;
  mobile: string;
  quantity: number;
  ticketType: TicketType;
  status: 'confirmed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
}

export interface DashboardDTO {
  totalEvents: number;
  upcomingEvents: number;
  totalBookings: number;
  totalAttendees: number;
}

export interface EventFilters {
  q?: string;
  category?: Category;
  dateFrom?: string;
  dateTo?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  sort?: 'date' | 'price' | 'popularity';
}
