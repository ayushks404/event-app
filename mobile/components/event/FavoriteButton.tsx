import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onPress: () => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ isFavorite, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-white/90 items-center justify-center shadow-sm"
      accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={22}
        color={isFavorite ? '#DC2626' : '#6B7280'}
      />
    </TouchableOpacity>
  );
};
