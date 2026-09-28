import React from 'react';
import { Text, View } from 'react-native';
import { formatCurrency } from '../../utils/format';

interface PriceSummaryProps {
  unit: number;
  quantity: number;
  subtotal: number;
  fee: number;
  tax: number;
  total: number;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  unit,
  quantity,
  subtotal,
  fee,
  tax,
  total,
}) => {
  return (
    <View className="bg-white rounded-card border border-line p-4 mb-4">
      <Text className="font-semibold text-base text-ink mb-3">Price Summary</Text>

      <View className="flex-row justify-between mb-2">
        <Text className="text-sm text-muted">
          Ticket Price ({quantity} × {formatCurrency(unit)})
        </Text>
        <Text className="text-sm font-semibold text-ink">{formatCurrency(subtotal)}</Text>
      </View>

      <View className="flex-row justify-between mb-2">
        <Text className="text-sm text-muted">Service Fee (5%)</Text>
        <Text className="text-sm font-semibold text-ink">{formatCurrency(fee)}</Text>
      </View>

      <View className="flex-row justify-between mb-3">
        <Text className="text-sm text-muted">GST (18%)</Text>
        <Text className="text-sm font-semibold text-ink">{formatCurrency(tax)}</Text>
      </View>

      <View className="flex-row justify-between border-t border-line pt-3">
        <Text className="text-base font-semibold text-ink">Total Amount</Text>
        <Text className="text-lg font-semibold text-primary">{formatCurrency(total)}</Text>
      </View>
    </View>
  );
};
