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
    <View
      className={`bg-slate-900 rounded-3xl border border-slate-800 p-5 mb-4 ${
        isCancelled ? 'opacity-60' : ''
      }`}
    >
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-base font-bold text-slate-100">{attendee.name}</Text>
        <Badge
          label={isCancelled ? 'Cancelled' : 'Confirmed'}
          tone={isCancelled ? 'danger' : 'success'}
        />
      </View>

      <Text className="text-xs font-mono font-bold text-indigo-400 mb-2">
        Code: {attendee.bookingCode}
      </Text>

      <View className="space-y-1 mb-3">
        <Text className="text-xs text-slate-400">✉️ {attendee.email}</Text>
        <Text className="text-xs text-slate-400">📱 +91 {attendee.mobile}</Text>
      </View>

      <View className="flex-row items-center justify-between border-t border-slate-800 pt-3">
        <Text className="text-xs font-semibold text-slate-200">
          {attendee.quantity} × {attendee.ticketType} ticket(s)
        </Text>
        <Text className="text-xs text-slate-400">
          {formatCurrency(attendee.totalAmount)} · {formatDate(attendee.createdAt.slice(0, 10))}
        </Text>
      </View>
    </View>
  );
});

AttendeeRow.displayName = 'AttendeeRow';
