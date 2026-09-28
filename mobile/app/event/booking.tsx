import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { useBookingStore } from '../../store/bookingStore';
import { TicketTypeSelector } from '../../components/booking/TicketTypeSelector';
import { QuantityStepper } from '../../components/booking/QuantityStepper';
import { PriceSummary } from '../../components/booking/PriceSummary';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { previewTotals } from '../../utils/pricing';
import { normalizeError } from '../../utils/error';
import { EventDetailDTO, TicketType } from '../../types/models';

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const fetchDetail = useEventStore((s) => s.fetchDetail);
  const { create: createBooking, creating } = useBookingStore();

  const [event, setEvent] = useState<EventDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketType, setTicketType] = useState<TicketType>('General');
  const [quantity, setQuantity] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDetail(id);
      setEvent(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [id, fetchDetail]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (loading && !event) {
    return <LoadingIndicator message="Preparing ticket selection..." />;
  }

  if (error || !event) {
    return (
      <ErrorState
        title="Event Unavailable"
        message={error || 'Could not load event data.'}
        onRetry={loadDetail}
      />
    );
  }

  const selectedTier =
    event.ticketTiers.find((t) => t.type === ticketType) || event.ticketTiers[0];
  const unitPrice = selectedTier ? selectedTier.unitPrice : event.ticketPrice;

  const maxAllowed = Math.min(
    event.pricing.maxQuantity,
    event.availableSeats
  );

  const totals = previewTotals(unitPrice, quantity, {
    feeBps: event.pricing.feeBps,
    taxBps: event.pricing.taxBps,
  });

  const handleConfirmBooking = async () => {
    setSubmitError(null);
    try {
      const booking = await createBooking({
        eventId: event.id,
        ticketType,
        quantity,
      });
      router.replace({
        pathname: '/booking/confirmation',
        params: { id: booking.id },
      });
    } catch (err: any) {
      const normErr = normalizeError(err);
      setSubmitError(normErr.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1">
        {/* Header Bar */}
        <View className="px-5 pt-12 pb-4 flex-row items-center border-b border-slate-900 bg-slate-950">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={20} color="#f8fafc" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-100" numberOfLines={1}>
              Book Tickets
            </Text>
            <Text className="text-xs text-slate-400" numberOfLines={1}>
              {event.name}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 120 }}
        >
          {/* Submit Error Banner */}
          {submitError && (
            <View className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-4 mb-5 flex-row items-center gap-3">
              <Ionicons name="alert-circle-outline" size={22} color="#f43f5e" />
              <Text className="text-rose-200 text-sm flex-1 font-medium">
                {submitError}
              </Text>
            </View>
          )}

          {/* Ticket Type Selector */}
          <Text className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-3">
            Select Ticket Type
          </Text>
          <TicketTypeSelector
            tiers={event.ticketTiers}
            value={ticketType}
            onChange={(type) => setTicketType(type)}
          />

          {/* Quantity Selector Card */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-base font-bold text-slate-100">
                  Select Quantity
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  Max {event.pricing.maxQuantity} per booking ({event.availableSeats} available)
                </Text>
              </View>
              <QuantityStepper
                value={quantity}
                min={1}
                max={maxAllowed > 0 ? maxAllowed : 1}
                onChange={setQuantity}
              />
            </View>
          </View>

          {/* Dynamic Price Breakdown Summary */}
          <PriceSummary
            unit={totals.unit}
            quantity={quantity}
            subtotal={totals.subtotal}
            fee={totals.fee}
            tax={totals.tax}
            total={totals.total}
          />
        </ScrollView>

        {/* Bottom CTA Bar */}
        <View className="absolute bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 px-5 py-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-slate-400">Total Payable</Text>
            <Text className="text-xl font-extrabold text-indigo-400">
              ₹{totals.total.toFixed(2)}
            </Text>
          </View>

          <View className="w-52">
            <PrimaryButton
              title="Confirm & Book"
              loading={creating}
              onPress={handleConfirmBooking}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
