import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { Role, UserDTO } from '../types/models';
import { AppApiError } from '../utils/error';
import { resetAllStores } from './reset';

export interface AuthState {
  user: UserDTO | null;
  token: string | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; mobile: string; password: string; confirmPassword: string; role?: Role }) => Promise<void>;
  updateProfile: (patch: { name?: string; mobile?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  loading: false,
  error: null,
  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        return set({ hydrated: true });
      }
      set({ token });
      const user = await authService.me();
      set({ user, hydrated: true });
    } catch (e) {
      if ((e as AppApiError).status === 401) {
        await SecureStore.deleteItemAsync('token');
        set({ token: null, user: null, hydrated: true });
      } else {
        set({ hydrated: true }); // network issue; stay hydrated and keep token for retry
      }
    }
  },
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { user, token } = await authService.login(email, password);
      await SecureStore.setItemAsync('token', token);
      set({ user, token, loading: false });
    } catch (e) {
      set({ loading: false, error: (e as AppApiError).message });
      throw e;
    }
  },
  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const { user, token } = await authService.register(data);
      await SecureStore.setItemAsync('token', token);
      set({ user, token, loading: false });
    } catch (e) {
      set({ loading: false, error: (e as AppApiError).message });
      throw e;
    }
  },
  updateProfile: async (patch) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.updateMe(patch);
      set({ user, loading: false });
    } catch (e) {
      set({ loading: false, error: (e as AppApiError).message });
      throw e;
    }
  },
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('token');
    } catch {}
    set({ user: null, token: null });
    resetAllStores();
  },
}));
