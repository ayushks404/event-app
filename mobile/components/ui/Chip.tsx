import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({ label, selected = false, onPress, icon }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
      className={`h-9 min-h-[44px] px-3.5 rounded-full flex-row items-center border ${
        selected
          ? 'bg-primary border-primary'
          : 'bg-white border-line'
      }`}
    >
      {icon ? <Text className="mr-1.5">{icon}</Text> : null}
      <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-ink'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};
