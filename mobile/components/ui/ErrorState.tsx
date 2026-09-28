import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from './PrimaryButton';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-6 my-8">
      <View className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 items-center justify-center mb-4">
        <Ionicons name="alert-circle-outline" size={32} color="#f43f5e" />
      </View>
      <Text className="font-bold text-lg text-slate-100 text-center mb-2">
        {title}
      </Text>
      <Text className="font-normal text-sm text-slate-400 text-center mb-6 px-4">
        {message}
      </Text>
      <PrimaryButton title="Try Again" onPress={onRetry} variant="outline" />
    </View>
  );
};
