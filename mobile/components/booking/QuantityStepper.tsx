import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuantityStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({ value, min, max, onChange }) => {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View className="flex-row items-center space-x-4">
      <TouchableOpacity
        onPress={() => canDecrease && onChange(value - 1)}
        disabled={!canDecrease}
        className={`w-11 h-11 min-h-[44px] min-w-[44px] rounded-btn items-center justify-center border ${
          canDecrease ? 'bg-white border-primary' : 'bg-line border-line'
        }`}
        accessibilityLabel="Decrease quantity"
      >
        <Ionicons name="remove" size={20} color={canDecrease ? '#4F46E5' : '#9CA3AF'} />
      </TouchableOpacity>

      <Text className="text-lg font-semibold text-ink min-w-[24px] text-center mx-2">{value}</Text>

      <TouchableOpacity
        onPress={() => canIncrease && onChange(value + 1)}
        disabled={!canIncrease}
        className={`w-11 h-11 min-h-[44px] min-w-[44px] rounded-btn items-center justify-center border ${
          canIncrease ? 'bg-primary border-primary' : 'bg-line border-line'
        }`}
        accessibilityLabel="Increase quantity"
      >
        <Ionicons name="add" size={20} color={canIncrease ? '#FFFFFF' : '#9CA3AF'} />
      </TouchableOpacity>
    </View>
  );
};
