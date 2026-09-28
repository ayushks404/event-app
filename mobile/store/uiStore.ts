import { create } from 'zustand';

export interface ToastState {
  toast: { message: string; type: 'info' | 'success' | 'error' | 'warning' } | null;
  showToast: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
  hideToast: () => void;
}

export const useUiStore = create<ToastState>((set) => ({
  toast: null,
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
  },
  hideToast: () => set({ toast: null }),
}));
