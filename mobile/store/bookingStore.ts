import { create } from 'zustand';
import { bookingsService } from '../services/bookings.service';
import { BookingDTO, TicketType } from '../types/models';
import { AppApiError } from '../utils/error';
import { useEventStore } from './eventStore';
import { registerReset } from './reset';

export interface TabBookings {
  items: BookingDTO[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  loaded: boolean;
  error: string | null;
}

export interface BookingState {
  byTab: {
    upcoming: TabBookings;
    completed: TabBookings;
    cancelled: TabBookings;
  };
  current: BookingDTO | null;
  creating: boolean;
  cancelling: boolean;

  create: (data: { eventId: string; ticketType: TicketType; quantity: number }) => Promise<BookingDTO>;
  fetchTab: (tab: 'upcoming' | 'completed' | 'cancelled', opts?: { reset?: boolean }) => Promise<void>;
  loadMore: (tab: 'upcoming' | 'completed' | 'cancelled') => Promise<void>;
  fetchOne: (id: string) => Promise<BookingDTO>;
  cancel: (id: string) => Promise<BookingDTO>;
}

const emptyTab = (): TabBookings => ({
  items: [],
  page: 1,
  hasMore: true,
  loading: false,
  loadingMore: false,
  loaded: false,
  error: null,
});

const initial = {
  byTab: {
    upcoming: emptyTab(),
    completed: emptyTab(),
    cancelled: emptyTab(),
  },
  current: null,
  creating: false,
  cancelling: false,
};

export const useBookingStore = create<BookingState>((set, get) => {
  registerReset(() => set({
    byTab: { upcoming: emptyTab(), completed: emptyTab(), cancelled: emptyTab() },
    current: null,
    creating: false,
    cancelling: false,
  }));

  return {
    ...initial,

    create: async (input) => {
      set({ creating: true });
      try {
        const booking = await bookingsService.create(input);
        set({ current: booking, creating: false });
        // Invalidate tab caches
        set((state) => ({
          byTab: {
            upcoming: { ...state.byTab.upcoming, loaded: false },
            completed: { ...state.byTab.completed, loaded: false },
            cancelled: { ...state.byTab.cancelled, loaded: false },
          },
        }));
        useEventStore.getState().invalidateDetail(input.eventId);
        return booking;
      } catch (e) {
        set({ creating: false });
        throw e;
      }
    },

    fetchTab: async (tab, opts = {}) => {
      const currentTab = get().byTab[tab];
      if (!opts.reset && currentTab.loaded) return;

      set((state) => ({
        byTab: {
          ...state.byTab,
          [tab]: { ...state.byTab[tab], loading: true, error: null },
        },
      }));

      try {
        const res = await bookingsService.list(tab, 1, 10);
        set((state) => ({
          byTab: {
            ...state.byTab,
            [tab]: {
              items: res.items,
              page: 1,
              hasMore: res.meta.hasMore,
              loading: false,
              loadingMore: false,
              loaded: true,
              error: null,
            },
          },
        }));
      } catch (e) {
        set((state) => ({
          byTab: {
            ...state.byTab,
            [tab]: { ...state.byTab[tab], loading: false, error: (e as AppApiError).message },
          },
        }));
      }
    },

    loadMore: async (tab) => {
      const currentTab = get().byTab[tab];
      if (!currentTab.hasMore || currentTab.loadingMore) return;

      const nextPage = currentTab.page + 1;
      set((state) => ({
        byTab: {
          ...state.byTab,
          [tab]: { ...state.byTab[tab], loadingMore: true },
        },
      }));

      try {
        const res = await bookingsService.list(tab, nextPage, 10);
        set((state) => ({
          byTab: {
            ...state.byTab,
            [tab]: {
              ...state.byTab[tab],
              items: [...state.byTab[tab].items, ...res.items],
              page: nextPage,
              hasMore: res.meta.hasMore,
              loadingMore: false,
            },
          },
        }));
      } catch (e) {
        set((state) => ({
          byTab: {
            ...state.byTab,
            [tab]: { ...state.byTab[tab], loadingMore: false },
          },
        }));
      }
    },

    fetchOne: async (id: string) => {
      const booking = await bookingsService.get(id);
      set({ current: booking });
      return booking;
    },

    cancel: async (id: string) => {
      set({ cancelling: true });
      try {
        const updated = await bookingsService.cancel(id);
        set({ current: updated, cancelling: false });

        // Update booking in upcoming/completed/cancelled tabs
        set((state) => {
          const newUpcomingItems = state.byTab.upcoming.items.filter((b) => b.id !== id);
          const newCancelledLoaded = false; // mark cancelled tab stale so it reloads
          return {
            byTab: {
              ...state.byTab,
              upcoming: { ...state.byTab.upcoming, items: newUpcomingItems },
              cancelled: { ...state.byTab.cancelled, loaded: newCancelledLoaded },
            },
          };
        });

        useEventStore.getState().invalidateDetail(updated.event.id);
        return updated;
      } catch (e) {
        set({ cancelling: false });
        throw e;
      }
    },
  };
});
