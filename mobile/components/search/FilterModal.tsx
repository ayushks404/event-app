import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '../../constants/categories';
import { Category, EventFilters } from '../../types/models';
import { formatDate, toDateString } from '../../utils/format';
import { Chip } from '../ui/Chip';
import { InputField } from '../ui/InputField';
import { PrimaryButton } from '../ui/PrimaryButton';

interface FilterModalProps {
  visible: boolean;
  initial: EventFilters;
  onApply: (filters: EventFilters) => void;
  onClose: () => void;
  onClear: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  initial,
  onApply,
  onClose,
  onClear,
}) => {
  const [category, setCategory] = useState<Category | undefined>(initial.category);
  const [dateFrom, setDateFrom] = useState<string | undefined>(initial.dateFrom);
  const [dateTo, setDateTo] = useState<string | undefined>(initial.dateTo);
  const [location, setLocation] = useState<string>(initial.location || '');
  const [minPrice, setMinPrice] = useState<string>(initial.minPrice !== undefined ? String(initial.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState<string>(initial.maxPrice !== undefined ? String(initial.maxPrice) : '');
  const [available, setAvailable] = useState<boolean>(initial.available || false);

  const [showDatePickerFrom, setShowDatePickerFrom] = useState(false);
  const [showDatePickerTo, setShowDatePickerTo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCategory(initial.category);
    setDateFrom(initial.dateFrom);
    setDateTo(initial.dateTo);
    setLocation(initial.location || '');
    setMinPrice(initial.minPrice !== undefined ? String(initial.minPrice) : '');
    setMaxPrice(initial.maxPrice !== undefined ? String(initial.maxPrice) : '');
    setAvailable(initial.available || false);
    setError(null);
  }, [initial, visible]);

  const handleApply = () => {
    const minP = minPrice ? Number(minPrice) : undefined;
    const maxP = maxPrice ? Number(maxPrice) : undefined;

    if (minP !== undefined && maxP !== undefined && minP > maxP) {
      setError('Max price must be greater than or equal to min price');
      return;
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError('End date must be on or after start date');
      return;
    }

    onApply({
      category,
      dateFrom,
      dateTo,
      location: location.trim() || undefined,
      minPrice: minP,
      maxPrice: maxP,
      available: available || undefined,
    });
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-surface">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-line bg-white">
          <Text className="text-lg font-semibold text-ink">Filters</Text>
          <TouchableOpacity onPress={onClose} className="p-2 min-h-[44px] min-w-[44px] items-center justify-center">
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
          {error ? <Text className="text-danger text-sm font-semibold mb-4 text-center">{error}</Text> : null}

          {/* Categories */}
          <Text className="font-semibold text-sm text-ink mb-2">Category</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                selected={category === cat}
                onPress={() => setCategory(category === cat ? undefined : cat)}
              />
            ))}
          </View>

          {/* Dates */}
          <Text className="font-semibold text-sm text-ink mb-2">Date Range</Text>
          <View className="flex-row space-x-3 mb-6">
            <View className="flex-1 mr-2">
              <Text className="text-xs text-muted mb-1">From</Text>
              <TouchableOpacity
                onPress={() => setShowDatePickerFrom(true)}
                className="h-12 min-h-[44px] bg-white border border-line rounded-btn px-3 flex-row items-center justify-between"
              >
                <Text className={dateFrom ? 'text-ink text-sm' : 'text-muted text-sm'}>
                  {dateFrom ? formatDate(dateFrom) : 'Select date'}
                </Text>
                {dateFrom ? (
                  <TouchableOpacity onPress={() => setDateFrom(undefined)} className="p-1">
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>

            <View className="flex-1 ml-2">
              <Text className="text-xs text-muted mb-1">To</Text>
              <TouchableOpacity
                onPress={() => setShowDatePickerTo(true)}
                className="h-12 min-h-[44px] bg-white border border-line rounded-btn px-3 flex-row items-center justify-between"
              >
                <Text className={dateTo ? 'text-ink text-sm' : 'text-muted text-sm'}>
                  {dateTo ? formatDate(dateTo) : 'Select date'}
                </Text>
                {dateTo ? (
                  <TouchableOpacity onPress={() => setDateTo(undefined)} className="p-1">
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {showDatePickerFrom ? (
            <DateTimePicker
              value={dateFrom ? new Date(dateFrom) : new Date()}
              mode="date"
              display="default"
              onChange={(_e, selected) => {
                setShowDatePickerFrom(false);
                if (selected) setDateFrom(toDateString(selected));
              }}
            />
          ) : null}

          {showDatePickerTo ? (
            <DateTimePicker
              value={dateTo ? new Date(dateTo) : new Date()}
              mode="date"
              display="default"
              onChange={(_e, selected) => {
                setShowDatePickerTo(false);
                if (selected) setDateTo(toDateString(selected));
              }}
            />
          ) : null}

          {/* Location */}
          <InputField
            label="Location"
            placeholder="Search venue or city..."
            value={location}
            onChangeText={setLocation}
          />

          {/* Price Range */}
          <Text className="font-semibold text-sm text-ink mb-2">Price Range (₹)</Text>
          <View className="flex-row space-x-3 mb-4">
            <View className="flex-1 mr-2">
              <InputField
                placeholder="Min price"
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />
            </View>
            <View className="flex-1 ml-2">
              <InputField
                placeholder="Max price"
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
          </View>

          {/* Available Seats Only */}
          <View className="flex-row items-center justify-between p-3 bg-white border border-line rounded-card mb-8">
            <Text className="font-semibold text-sm text-ink">Available seats only</Text>
            <Switch
              value={available}
              onValueChange={setAvailable}
              trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
            />
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View className="flex-row p-4 bg-white border-t border-line space-x-3">
          <TouchableOpacity
            onPress={handleClear}
            className="h-12 min-h-[44px] px-4 rounded-btn items-center justify-center border border-line mr-3"
          >
            <Text className="font-semibold text-muted">Clear Filters</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <PrimaryButton title="Apply Filters" onPress={handleApply} />
          </View>
        </View>
      </View>
    </Modal>
  );
};
