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
    <View className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md m-1.5 min-w-[140px]">
      <View className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 items-center justify-center mb-3">
        <Ionicons name={icon} size={20} color="#818cf8" />
      </View>
      <Text className="text-2xl font-extrabold text-slate-100 mb-0.5">{value}</Text>
      <Text className="text-xs text-slate-400 font-medium">{label}</Text>
    </View>
  );
};
