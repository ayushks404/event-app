import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { BookingDTO } from '../../types/models';
import { formatCurrency, formatDate, formatTime } from '../../utils/format';
import { Badge } from '../ui/Badge';

interface BookingCardProps {
  booking: BookingDTO;
  onPress: () => void;
  onCancel?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = React.memo(({ booking, onPress, onCancel }) => {
  let tone: 'success' | 'danger' | 'muted' = 'success';
  let statusText = 'Upcoming';

  if (booking.phase === 'completed') {
    tone = 'muted';
    statusText = 'Completed';
  } else if (booking.phase === 'cancelled') {
    tone = 'danger';
    statusText = 'Cancelled';
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white rounded-card border border-line p-4 shadow-sm mb-4"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-mono font-semibold text-muted">{booking.bookingCode}</Text>
        <Badge label={statusText} tone={tone} />
      </View>

      <Text className="text-base font-semibold text-ink mb-1">{booking.event.name}</Text>
      <Text className="text-xs text-muted font-normal mb-3">
        {formatDate(booking.event.date)} · {formatTime(booking.event.startTime)}
      </Text>

      <View className="flex-row items-center justify-between border-t border-line pt-3 mt-1">
        <View>
          <Text className="text-xs text-muted">
            {booking.quantity} × {booking.ticketType} ticket(s)
          </Text>
          <Text className="text-sm font-semibold text-ink mt-0.5">{formatCurrency(booking.totalAmount)}</Text>
        </View>

        {booking.canCancel && onCancel ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="px-3 py-1.5 min-h-[44px] rounded-btn border border-danger items-center justify-center"
          >
            <Text className="text-xs font-semibold text-danger">Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

BookingCard.displayName = 'BookingCard';
