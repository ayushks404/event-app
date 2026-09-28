import '../global.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastHost } from '../components/ui/ToastHost';
import { setAuthHandlers } from '../services/api';
import { healthService } from '../services/health.service';
import { useAuthStore } from '../store/authStore';
import { useFavoritesStore } from '../store/favoritesStore';

SplashScreen.preventAutoHideAsync();

setAuthHandlers({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    void useAuthStore.getState().logout();
  },
});

export default function RootLayout() {
  const { hydrated, token, hydrate } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void hydrate();
    void healthService.ping().catch(() => {});
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void SplashScreen.hideAsync();
    const inAuth = segments[0] === '(auth)';
    if (!token && !inAuth) {
      router.replace('/(auth)/login');
    } else if (token && inAuth) {
      router.replace('/(tabs)');
    }
  }, [hydrated, token, segments]);

  useEffect(() => {
    if (token) {
      void useFavoritesStore.getState().fetch();
    }
  }, [token]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <ToastHost />
    </SafeAreaProvider>
  );
}
