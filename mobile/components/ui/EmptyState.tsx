import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  subtitle?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  message,
  actionLabel,
  onAction,
}) => {
  const displaySubtitle = subtitle || message;

  return (
    <View className="flex-1 items-center justify-center p-6 my-8">
      {icon ? (
        <View className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 items-center justify-center mb-4">
          {typeof icon === 'string' ? (
            <Ionicons name={icon as any} size={30} color="#818cf8" />
          ) : (
            icon
          )}
        </View>
      ) : null}
      <Text className="font-bold text-lg text-slate-100 text-center mb-1">
        {title}
      </Text>
      {displaySubtitle ? (
        <Text className="font-normal text-sm text-slate-400 text-center mb-5 px-4">
          {displaySubtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-2">
          <PrimaryButton title={actionLabel} onPress={onAction} variant="outline" />
        </View>
      ) : null}
    </View>
  );
};
