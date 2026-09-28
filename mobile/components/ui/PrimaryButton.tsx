import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
  icon?: React.ReactNode;
  className?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  className = '',
}) => {
  const isInteractive = !loading && !disabled;

  let bgClass = 'bg-primary';
  let textClass = 'text-white';

  if (variant === 'outline') {
    bgClass = 'bg-transparent border border-primary';
    textClass = 'text-primary';
  } else if (variant === 'danger') {
    bgClass = 'bg-danger';
    textClass = 'text-white';
  }

  if (disabled) {
    bgClass = 'bg-line';
    textClass = 'text-muted';
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.8}
      className={`h-12 min-h-[44px] px-6 rounded-btn flex-row items-center justify-center ${bgClass} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#4F46E5' : '#FFFFFF'} />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon ? <View className="mr-2">{icon}</View> : null}
          <Text className={`font-semibold text-base ${textClass}`}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
