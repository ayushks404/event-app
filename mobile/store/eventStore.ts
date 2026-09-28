import { create } from 'zustand';
import { eventsService } from '../services/events.service';
import { EventDetailDTO, EventFilters, EventSummaryDTO } from '../types/models';
import { AppApiError } from '../utils/error';
import { registerReset } from './reset';

export interface EventState {
  featured: EventSummaryDTO[];
  upcoming: EventSummaryDTO[];
  list: EventSummaryDTO[];
  filters: EventFilters;
  query: string;
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  detailById: Record<string, EventDetailDTO>;
  detailLoading: boolean;

  fetchHome: () => Promise<void>;
  setQuery: (q: string) => void;
  search: () => Promise<void>;
  loadMore: () => Promise<void>;
  applyFilters: (f: EventFilters) => void;
  clearFilters: () => void;
  fetchDetail: (id: string, opts?: { force?: boolean }) => Promise<EventDetailDTO>;
  invalidateDetail: (id: string) => void;
}

let latestRequestId = 0;

const initial = {
  featured: [],
  upcoming: [],
  list: [],
  filters: {},
  query: '',
  page: 1,
  hasMore: true,
  loading: false,
  loadingMore: false,
  error: null,
  detailById: {},
  detailLoading: false,
};

export const useEventStore = create<EventState>((set, get) => {
  registerReset(() => set(initial));

  return {
    ...initial,

    fetchHome: async () => {
      set({ loading: true, error: null });
      try {
        const [featRes, upRes] = await Promise.all([
          eventsService.list({ featured: true }),
          eventsService.list({ limit: 10, page: 1 }),
        ]);
        set({
          featured: featRes.items,
          upcoming: upRes.items,
          loading: false,
        });
      } catch (e) {
        set({ loading: false, error: (e as AppApiError).message });
      }
    },

    setQuery: (query: string) => set({ query }),

    search: async () => {
      const reqId = ++latestRequestId;
      const { query, filters } = get();
      set({ loading: true, page: 1, error: null });
      try {
        const res = await eventsService.list({
          ...filters,
          q: query || undefined,
          page: 1,
          limit: 10,
        });
        if (reqId === latestRequestId) {
          set({
            list: res.items,
            page: 1,
            hasMore: res.meta.hasMore,
            loading: false,
          });
        }
      } catch (e) {
        if (reqId === latestRequestId) {
          set({ loading: false, error: (e as AppApiError).message });
        }
      }
    },

    loadMore: async () => {
      const { list, page, hasMore, loadingMore, query, filters } = get();
      if (!hasMore || loadingMore) return;
      const nextPage = page + 1;
      set({ loadingMore: true });
      try {
        const res = await eventsService.list({
          ...filters,
          q: query || undefined,
          page: nextPage,
          limit: 10,
        });
        set({
          list: [...list, ...res.items],
          page: nextPage,
          hasMore: res.meta.hasMore,
          loadingMore: false,
        });
      } catch (e) {
        set({ loadingMore: false });
      }
    },

    applyFilters: (newFilters: EventFilters) => {
      set({ filters: newFilters, page: 1 });
      void get().search();
    },

    clearFilters: () => {
      set({ filters: {}, query: '', page: 1 });
      void get().search();
    },

    fetchDetail: async (id: string, opts = {}) => {
      const { detailById } = get();
      if (!opts.force && detailById[id]) {
        return detailById[id];
      }
      set({ detailLoading: true, error: null });
      try {
        const detail = await eventsService.detail(id);
        set((state) => ({
          detailById: { ...state.detailById, [id]: detail },
          detailLoading: false,
        }));
        return detail;
      } catch (e) {
        set({ detailLoading: false, error: (e as AppApiError).message });
        throw e;
      }
    },

    invalidateDetail: (id: string) => {
      set((state) => {
        const copy = { ...state.detailById };
        delete copy[id];
        return { detailById: copy };
      });
    },
  };
});
