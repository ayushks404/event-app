import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ICONS } from '../../constants/categories';
import { Category } from '../../types/models';

interface CategoryCardProps {
  category: Category;
  selected?: boolean;
  onPress: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = React.memo(({ category, selected = false, onPress }) => {
  const iconName = (CATEGORY_ICONS[category] || 'calendar') as any;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`p-3 rounded-card items-center justify-center mr-3 min-w-[84px] min-h-[44px] border ${
        selected ? 'bg-primary border-primary' : 'bg-white border-line'
      }`}
    >
      <View className={`w-10 h-10 rounded-full items-center justify-center mb-1.5 ${selected ? 'bg-white/20' : 'bg-primary/10'}`}>
        <Ionicons name={iconName} size={20} color={selected ? '#FFFFFF' : '#4F46E5'} />
      </View>
      <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-ink'}`}>{category}</Text>
    </TouchableOpacity>
  );
});

CategoryCard.displayName = 'CategoryCard';
