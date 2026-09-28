import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  onFilterPress,
  placeholder = 'Search events, venues, categories...',
}) => {
  return (
    <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-3.5 h-12 flex-1 shadow-sm">
      <Ionicons name="search" size={20} color="#94a3b8" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        className="flex-1 text-slate-100 text-sm h-full ml-2"
      />
      {value && onClear ? (
        <TouchableOpacity
          onPress={onClear}
          className="p-1 min-h-[44px] min-w-[44px] items-center justify-center"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color="#64748b" />
        </TouchableOpacity>
      ) : null}
      {onFilterPress ? (
        <TouchableOpacity
          onPress={onFilterPress}
          className="p-1 min-h-[44px] min-w-[44px] items-center justify-center border-l border-slate-800 ml-1 pl-2"
        >
          <Ionicons name="options-outline" size={18} color="#818cf8" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
