import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search events, venues, categories...',
}) => {
  return (
    <View className="flex-row items-center bg-white border border-line rounded-btn px-3.5 h-12 min-h-[44px] shadow-sm flex-1">
      <Ionicons name="search" size={20} color="#6B7280" className="mr-2" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        className="flex-1 text-ink text-base h-full ml-2"
      />
      {value ? (
        <TouchableOpacity
          onPress={onClear}
          className="p-1 min-h-[44px] min-w-[44px] items-center justify-center"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
