import React from 'react';
import { ActivityIndicator, View } from 'react-native';

interface LoadingIndicatorProps {
  fullscreen?: boolean;
  size?: 'small' | 'large';
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  fullscreen = false,
  size = 'large',
}) => {
  if (fullscreen) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size={size} color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="py-6 items-center justify-center">
      <ActivityIndicator size={size} color="#4F46E5" />
    </View>
  );
};
