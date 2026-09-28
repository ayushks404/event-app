import { create } from 'zustand';
import { eventsService } from '../services/events.service';
import { organizerService } from '../services/organizer.service';
import { AttendeeDTO, DashboardDTO, OrganizerEventDTO } from '../types/models';
import { AppApiError } from '../utils/error';
import { registerReset } from './reset';

export interface OrganizerState {
  dashboard: DashboardDTO | null;
  events: OrganizerEventDTO[];
  attendeesByEvent: Record<string, AttendeeDTO[]>;
  loading: boolean;
  error: string | null;

  fetchDashboard: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchAttendees: (eventId: string, q?: string) => Promise<void>;
  createEvent: (data: any) => Promise<void>;
  updateEvent: (id: string, data: any) => Promise<void>;
  removeEvent: (id: string) => Promise<{ action: 'deleted' | 'cancelled'; cancelledBookings: number }>;
}

const initial = {
  dashboard: null,
  events: [],
  attendeesByEvent: {},
  loading: false,
  error: null,
};

export const useOrganizerStore = create<OrganizerState>((set, get) => {
  registerReset(() => set(initial));

  return {
    ...initial,

    fetchDashboard: async () => {
      set({ loading: true, error: null });
      try {
        const dashboard = await organizerService.dashboard();
        set({ dashboard, loading: false });
      } catch (e) {
        set({ loading: false, error: (e as AppApiError).message });
      }
    },

    fetchEvents: async () => {
      set({ loading: true, error: null });
      try {
        const events = await organizerService.events();
        set({ events, loading: false });
      } catch (e) {
        set({ loading: false, error: (e as AppApiError).message });
      }
    },

    fetchAttendees: async (eventId: string, q?: string) => {
      set({ loading: true, error: null });
      try {
        const list = await organizerService.attendees(eventId, q);
        set((state) => ({
          attendeesByEvent: { ...state.attendeesByEvent, [eventId]: list },
          loading: false,
        }));
      } catch (e) {
        set({ loading: false, error: (e as AppApiError).message });
      }
    },

    createEvent: async (data) => {
      set({ loading: true });
      try {
        await eventsService.create(data);
        await Promise.all([get().fetchEvents(), get().fetchDashboard()]);
      } catch (e) {
        set({ loading: false });
        throw e;
      }
    },

    updateEvent: async (id, data) => {
      set({ loading: true });
      try {
        await eventsService.update(id, data);
        await Promise.all([get().fetchEvents(), get().fetchDashboard()]);
      } catch (e) {
        set({ loading: false });
        throw e;
      }
    },

    removeEvent: async (id: string) => {
      set({ loading: true });
      try {
        const res = await eventsService.remove(id);
        await Promise.all([get().fetchEvents(), get().fetchDashboard()]);
        return res;
      } catch (e) {
        set({ loading: false });
        throw e;
      }
    },
  };
});
