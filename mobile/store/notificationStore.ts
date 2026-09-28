import { create } from 'zustand';
import { notificationsService } from '../services/notifications.service';
import { NotificationDTO } from '../types/models';
import { registerReset } from './reset';

export interface NotificationState {
  items: NotificationDTO[];
  unreadCount: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;

  fetch: (opts?: { reset?: boolean }) => Promise<void>;
  loadMore: () => Promise<void>;
  pollUnread: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const initial = {
  items: [],
  unreadCount: 0,
  page: 1,
  hasMore: true,
  loading: false,
  loadingMore: false,
  error: null,
};

export const useNotificationStore = create<NotificationState>((set, get) => {
  registerReset(() => set(initial));

  return {
    ...initial,

    fetch: async (opts = {}) => {
      set({ loading: true, error: null });
      try {
        const [res, unread] = await Promise.all([
          notificationsService.list(1, 10),
          notificationsService.unreadCount(),
        ]);
        set({
          items: res.items,
          unreadCount: unread,
          page: 1,
          hasMore: res.meta.hasMore,
          loading: false,
        });
      } catch (e) {
        set({ loading: false, error: (e as any).message });
      }
    },

    loadMore: async () => {
      const { items, page, hasMore, loadingMore } = get();
      if (!hasMore || loadingMore) return;
      const nextPage = page + 1;
      set({ loadingMore: true });
      try {
        const res = await notificationsService.list(nextPage, 10);
        set({
          items: [...items, ...res.items],
          page: nextPage,
          hasMore: res.meta.hasMore,
          loadingMore: false,
        });
      } catch (e) {
        set({ loadingMore: false });
      }
    },

    pollUnread: async () => {
      try {
        const count = await notificationsService.unreadCount();
        set({ unreadCount: count });
      } catch {}
    },

    markRead: async (id: string) => {
      // Optimistic
      set((state) => ({
        items: state.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
      try {
        await notificationsService.markRead(id);
      } catch {}
    },

    markAllRead: async () => {
      set((state) => ({
        items: state.items.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
      try {
        await notificationsService.markAllRead();
      } catch {}
    },
  };
});
