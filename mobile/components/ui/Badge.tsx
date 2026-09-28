import React from 'react';
import { Text, View } from 'react-native';

interface BadgeProps {
  label: string;
  tone?: 'success' | 'danger' | 'warning' | 'muted' | 'primary';
}

export const Badge: React.FC<BadgeProps> = ({ label, tone = 'primary' }) => {
  let bgClass = 'bg-primary/10';
  let textClass = 'text-primary';

  if (tone === 'success') {
    bgClass = 'bg-success/10';
    textClass = 'text-success';
  } else if (tone === 'danger') {
    bgClass = 'bg-danger/10';
    textClass = 'text-danger';
  } else if (tone === 'warning') {
    bgClass = 'bg-warning/10';
    textClass = 'text-warning';
  } else if (tone === 'muted') {
    bgClass = 'bg-muted/10';
    textClass = 'text-muted';
  }

  return (
    <View className={`px-2.5 py-1 rounded-full align-self-start ${bgClass}`}>
      <Text className={`text-xs font-semibold ${textClass}`}>{label}</Text>
    </View>
  );
};
