import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventSummaryDTO } from '../../types/models';
import { formatCurrency, formatDate, formatTime } from '../../utils/format';
import { FavoriteButton } from './FavoriteButton';
import { SeatsBadge } from './SeatsBadge';

interface EventCardProps {
  event: EventSummaryDTO;
  isFavorite?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
  variant?: 'vertical' | 'horizontal';
}

export const EventCard: React.FC<EventCardProps> = React.memo(({
  event,
  isFavorite = false,
  onPress,
  onToggleFavorite,
  variant = 'vertical',
}) => {
  const [imageError, setImageError] = useState(false);

  const priceText = event.ticketPrice === 0 ? 'Free' : `From ${formatCurrency(event.ticketPrice)}`;

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className="bg-white rounded-card border border-line p-3 shadow-sm mr-4 w-[280px]"
      >
        <View className="relative w-full h-36 rounded-lg overflow-hidden bg-line mb-3">
          {event.image && !imageError ? (
            <Image
              source={{ uri: event.image }}
              className="w-full h-full"
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View className="w-full h-full items-center justify-center bg-line">
              <Ionicons name="image-outline" size={32} color="#9CA3AF" />
            </View>
          )}
          {onToggleFavorite ? (
            <View className="absolute top-2 right-2">
              <FavoriteButton isFavorite={isFavorite} onPress={onToggleFavorite} />
            </View>
          ) : null}
          <View className="absolute bottom-2 left-2">
            <SeatsBadge availableSeats={event.availableSeats} isSoldOut={event.isSoldOut} />
          </View>
        </View>

        <Text className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">{event.category}</Text>
        <Text className="text-base font-semibold text-ink mb-1" numberOfLines={1}>{event.name}</Text>
        <Text className="text-xs text-muted font-normal mb-2">
          {formatDate(event.date)} · {formatTime(event.startTime)}
        </Text>
        <View className="flex-row items-center justify-between mt-auto">
          <Text className="text-xs text-muted mr-2 flex-1" numberOfLines={1}>{event.venue}</Text>
          <Text className="text-sm font-semibold text-primary">{priceText}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white rounded-card border border-line p-4 shadow-sm mb-4"
    >
      <View className="relative w-full h-44 rounded-lg overflow-hidden bg-line mb-3">
        {event.image && !imageError ? (
          <Image
            source={{ uri: event.image }}
            className="w-full h-full"
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View className="w-full h-full items-center justify-center bg-line">
            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
          </View>
        )}
        {onToggleFavorite ? (
          <View className="absolute top-2.5 right-2.5">
            <FavoriteButton isFavorite={isFavorite} onPress={onToggleFavorite} />
          </View>
        ) : null}
        <View className="absolute bottom-2.5 left-2.5">
          <SeatsBadge availableSeats={event.availableSeats} isSoldOut={event.isSoldOut} />
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-xs font-semibold text-primary uppercase tracking-wide">{event.category}</Text>
        <Text className="text-base font-semibold text-primary">{priceText}</Text>
      </View>

      <Text className="text-lg font-semibold text-ink mb-1.5">{event.name}</Text>

      <View className="flex-row items-center mb-1">
        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
        <Text className="text-xs text-muted font-normal ml-1.5">
          {formatDate(event.date)} · {formatTime(event.startTime)}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Ionicons name="location-outline" size={14} color="#6B7280" />
        <Text className="text-xs text-muted font-normal ml-1.5" numberOfLines={1}>{event.venue}, {event.address}</Text>
      </View>
    </TouchableOpacity>
  );
});

EventCard.displayName = 'EventCard';
