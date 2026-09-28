import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BookingDTO } from '../../types/models';
import { formatDate, formatTimeRange } from '../../utils/format';

interface TicketCardProps {
  booking: BookingDTO;
}

export const TicketCard: React.FC<TicketCardProps> = ({ booking }) => {
  const user = booking.user;

  return (
    <View className="bg-white rounded-card border border-line p-5 shadow-sm mb-6">
      <View className="flex-row items-center justify-between border-b border-line pb-4 mb-4">
        <View>
          <Text className="text-xs font-semibold text-primary uppercase">Digital Ticket</Text>
          <Text className="text-xl font-semibold text-ink mt-0.5">{booking.event.name}</Text>
        </View>
        <Ionicons name="ticket-outline" size={28} color="#4F46E5" />
      </View>

      <View className="space-y-3 mb-6">
        {user ? (
          <View className="mb-2">
            <Text className="text-xs text-muted">Attendee</Text>
            <Text className="text-sm font-semibold text-ink">{user.name}</Text>
          </View>
        ) : null}

        <View className="flex-row justify-between mb-2">
          <View>
            <Text className="text-xs text-muted">Date & Time</Text>
            <Text className="text-sm font-semibold text-ink">
              {formatDate(booking.event.date)}
            </Text>
            <Text className="text-xs text-muted">
              {formatTimeRange(booking.event.startTime, booking.event.endTime)}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-xs text-muted">Ticket Tier</Text>
            <Text className="text-sm font-semibold text-ink">
              {booking.quantity} × {booking.ticketType}
            </Text>
          </View>
        </View>

        <View className="mb-2">
          <Text className="text-xs text-muted">Venue</Text>
          <Text className="text-sm font-semibold text-ink">{booking.event.venue}</Text>
          <Text className="text-xs text-muted">{booking.event.address}</Text>
        </View>
      </View>

      {/* QR Code Placeholder */}
      <View className="items-center justify-center pt-2 border-t border-dashed border-line">
        <View className="w-[120px] h-[120px] border-2 border-dashed border-primary rounded-lg items-center justify-center bg-primary/5 p-2 mb-2">
          <Ionicons name="qr-code-outline" size={54} color="#4F46E5" />
          <Text className="text-[10px] font-mono font-semibold text-primary mt-1">{booking.bookingCode}</Text>
        </View>
        <Text className="text-xs font-mono font-semibold text-ink">Code: {booking.bookingCode}</Text>
      </View>
    </View>
  );
};
