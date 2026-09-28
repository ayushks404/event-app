import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationDTO } from '../../types/models';
import { relativeTime } from '../../utils/format';

interface NotificationCardProps {
  notification: NotificationDTO;
  onPress: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = React.memo(({ notification, onPress }) => {
  let iconName = 'notifications-outline';
  let iconColor = '#4F46E5';

  if (notification.type === 'BOOKING_CONFIRMED') {
    iconName = 'checkmark-circle-outline';
    iconColor = '#16A34A';
  } else if (notification.type === 'BOOKING_CANCELLED') {
    iconName = 'close-circle-outline';
    iconColor = '#DC2626';
  } else if (notification.type === 'EVENT_REMINDER') {
    iconName = 'alarm-outline';
    iconColor = '#D97706';
  } else if (notification.type === 'EVENT_UPDATED') {
    iconName = 'refresh-circle-outline';
    iconColor = '#4F46E5';
  } else if (notification.type === 'EVENT_CANCELLED') {
    iconName = 'alert-circle-outline';
    iconColor = '#DC2626';
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`bg-white rounded-card border ${
        notification.isRead ? 'border-line' : 'border-primary/40 bg-primary/5'
      } p-4 mb-3 flex-row items-start`}
    >
      <View className="mr-3.5 mt-0.5">
        <Ionicons name={iconName as any} size={26} color={iconColor} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-sm font-semibold text-ink flex-1 mr-2">{notification.title}</Text>
          <Text className="text-xs text-muted font-normal">{relativeTime(notification.createdAt)}</Text>
        </View>

        <Text className="text-xs text-muted font-normal leading-relaxed">{notification.message}</Text>
      </View>

      {!notification.isRead ? (
        <View className="w-2.5 h-2.5 rounded-full bg-primary ml-2 mt-1.5" />
      ) : null}
    </TouchableOpacity>
  );
});

NotificationCard.displayName = 'NotificationCard';
