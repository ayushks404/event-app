import React from 'react';
import { Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-6 my-8">
      {icon ? <View className="mb-4">{icon}</View> : null}
      <Text className="font-semibold text-lg text-ink text-center mb-1">{title}</Text>
      {subtitle ? <Text className="font-normal text-sm text-muted text-center mb-5">{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <View className="mt-2">
          <PrimaryButton title={actionLabel} onPress={onAction} variant="outline" />
        </View>
      ) : null}
    </View>
  );
};
