import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from './PrimaryButton';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <View className="flex-1 items-center justify-center p-6 my-8">
      <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
      <Text className="font-semibold text-base text-ink text-center mt-3 mb-2">Something went wrong</Text>
      <Text className="font-normal text-sm text-muted text-center mb-6">{message}</Text>
      <PrimaryButton title="Try Again" onPress={onRetry} variant="outline" />
    </View>
  );
};
