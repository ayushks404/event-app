import React from 'react';
import { Text, View } from 'react-native';
import { AttendeeDTO } from '../../types/models';
import { formatCurrency, formatDate } from '../../utils/format';
import { Badge } from '../ui/Badge';

interface AttendeeRowProps {
  attendee: AttendeeDTO;
}

export const AttendeeRow: React.FC<AttendeeRowProps> = React.memo(({ attendee }) => {
  const isCancelled = attendee.status === 'cancelled';

  return (
    <View className={`bg-white rounded-card border border-line p-4 mb-3 ${isCancelled ? 'opacity-60' : ''}`}>
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-base font-semibold text-ink">{attendee.name}</Text>
        <Badge
          label={isCancelled ? 'Cancelled' : 'Confirmed'}
          tone={isCancelled ? 'danger' : 'success'}
        />
      </View>

      <Text className="text-xs font-mono font-semibold text-muted mb-2">
        Code: {attendee.bookingCode}
      </Text>

      <View className="space-y-1 mb-2">
        <Text className="text-xs text-muted">Email: {attendee.email}</Text>
        <Text className="text-xs text-muted">Mobile: {attendee.mobile}</Text>
      </View>

      <View className="flex-row items-center justify-between border-t border-line pt-2 mt-2">
        <Text className="text-xs font-medium text-ink">
          {attendee.quantity} × {attendee.ticketType} ticket(s)
        </Text>
        <Text className="text-xs text-muted">
          {formatCurrency(attendee.totalAmount)} · {formatDate(attendee.createdAt.slice(0, 10))}
        </Text>
      </View>
    </View>
  );
});

AttendeeRow.displayName = 'AttendeeRow';
