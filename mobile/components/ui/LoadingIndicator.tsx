import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingIndicatorProps {
  fullscreen?: boolean;
  size?: 'small' | 'large';
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  fullscreen = false,
  size = 'large',
  message,
}) => {
  if (fullscreen) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 p-6">
        <ActivityIndicator size={size} color="#818cf8" />
        {message ? (
          <Text className="text-slate-400 text-sm font-medium mt-3 text-center">
            {message}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="py-8 items-center justify-center">
      <ActivityIndicator size={size} color="#818cf8" />
      {message ? (
        <Text className="text-slate-400 text-sm font-medium mt-3 text-center">
          {message}
        </Text>
      ) : null}
    </View>
  );
};
