import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TicketType } from '../../types/models';
import { formatCurrency } from '../../utils/format';

interface Tier {
  type: TicketType;
  unitPrice: number;
}

interface TicketTypeSelectorProps {
  tiers: Tier[];
  value: TicketType;
  onChange: (type: TicketType) => void;
}

export const TicketTypeSelector: React.FC<TicketTypeSelectorProps> = ({ tiers, value, onChange }) => {
  return (
    <View className="flex-row space-x-3 mb-4">
      {tiers.map((t) => {
        const selected = value === t.type;
        return (
          <TouchableOpacity
            key={t.type}
            onPress={() => onChange(t.type)}
            activeOpacity={0.8}
            className={`flex-1 p-3.5 rounded-card border min-h-[44px] ${
              selected ? 'bg-primary/5 border-primary' : 'bg-white border-line'
            }`}
          >
            <Text className={`text-sm font-semibold mb-1 ${selected ? 'text-primary' : 'text-ink'}`}>
              {t.type}
            </Text>
            <Text className="text-xs font-semibold text-muted">{formatCurrency(t.unitPrice)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
