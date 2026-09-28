import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => {
  return (
    <View className="flex-1 bg-white rounded-card border border-line p-4 shadow-sm m-1.5 min-w-[140px]">
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mb-3">
        <Ionicons name={icon} size={20} color="#4F46E5" />
      </View>
      <Text className="text-2xl font-bold text-ink mb-0.5">{value}</Text>
      <Text className="text-xs text-muted font-medium">{label}</Text>
    </View>
  );
};
