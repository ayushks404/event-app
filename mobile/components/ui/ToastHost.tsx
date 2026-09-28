import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../../store/uiStore';

export const ToastHost: React.FC = () => {
  const toast = useUiStore((state) => state.toast);
  const hideToast = useUiStore((state) => state.hideToast);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  let bgClass = 'bg-ink';
  if (toast.type === 'success') bgClass = 'bg-success';
  if (toast.type === 'error') bgClass = 'bg-danger';
  if (toast.type === 'warning') bgClass = 'bg-warning';

  return (
    <View
      style={{ top: insets.top + 10 }}
      className="absolute left-4 right-4 z-50 pointer-events-none"
    >
      <View className={`p-4 rounded-card shadow-lg flex-row items-center ${bgClass}`}>
        <Text className="text-white font-medium text-sm flex-1">{toast.message}</Text>
      </View>
    </View>
  );
};
