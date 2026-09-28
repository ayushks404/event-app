import { create } from 'zustand';
import { favoritesService } from '../services/favorites.service';
import { EventSummaryDTO } from '../types/models';
import { AppApiError } from '../utils/error';
import { registerReset } from './reset';
import { useUiStore } from './uiStore';

export interface FavoritesState {
  ids: Set<string>;
  items: EventSummaryDTO[];
  loading: boolean;
  fetch: () => Promise<void>;
  toggle: (eventId: string) => Promise<void>;
  isFavorite: (eventId: string) => boolean;
}

const initial = {
  ids: new Set<string>(),
  items: [],
  loading: false,
};

export const useFavoritesStore = create<FavoritesState>((set, get) => {
  registerReset(() => set({ ids: new Set<string>(), items: [], loading: false }));

  return {
    ...initial,

    isFavorite: (eventId: string) => get().ids.has(eventId),

    fetch: async () => {
      set({ loading: true });
      try {
        const items = await favoritesService.list();
        const ids = new Set(items.map((i) => i.id));
        set({ items, ids, loading: false });
      } catch (e) {
        set({ loading: false });
      }
    },

    toggle: async (eventId: string) => {
      const { ids, items } = get();
      const currentlyFavorite = ids.has(eventId);

      // Optimistic update
      const newIds = new Set(ids);
      if (currentlyFavorite) {
        newIds.delete(eventId);
      } else {
        newIds.add(eventId);
      }
      const newItems = items.filter((item) => item.id !== eventId);
      set({ ids: newIds, items: newItems });

      try {
        if (currentlyFavorite) {
          await favoritesService.remove(eventId);
        } else {
          await favoritesService.add(eventId);
        }
      } catch (e) {
        // Rollback on failure
        set({ ids, items });
        useUiStore.getState().showToast((e as AppApiError).message || 'Failed to update favorite', 'error');
      }
    },
  };
});
