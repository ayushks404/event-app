import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookingStore } from '../../store/bookingStore';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatDate, formatTime, formatCurrency } from '../../utils/format';
import { BookingDTO } from '../../types/models';

export default function ConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const fetchOne = useBookingStore((s) => s.fetchOne);

  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBooking = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOne(id);
      setBooking(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  }, [id, fetchOne]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  if (loading && !booking) {
    return <LoadingIndicator message="Finalizing your reservation..." />;
  }

  if (error || !booking) {
    return (
      <ErrorState
        title="Confirmation Unavailable"
        message={error || 'Booking record could not be loaded.'}
        onRetry={loadBooking}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon Badge */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-100 tracking-tight text-center">
            Booking Confirmed!
          </Text>
          <Text className="text-slate-400 text-sm mt-1 text-center">
            Your seats have been successfully reserved
          </Text>
        </View>

        {/* Ticket Summary Card */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6 shadow-xl">
          {/* Booking Code Pill */}
          <View className="items-center mb-6">
            <Text className="text-xs font-semibold uppercase text-slate-400 tracking-widest mb-1">
              Booking Code
            </Text>
            <View className="bg-indigo-600/20 border border-indigo-500/40 px-5 py-2 rounded-2xl">
              <Text className="text-2xl font-mono font-extrabold text-indigo-400 tracking-wider">
                {booking.bookingCode}
              </Text>
            </View>
          </View>

          <View className="h-[1px] bg-slate-800 mb-5" />

          {/* Event Details */}
          <Text className="text-xl font-bold text-slate-100 mb-1">
            {booking.event.name}
          </Text>
          <Text className="text-sm text-slate-400 mb-4">
            {formatDate(booking.event.date)} · {formatTime(booking.event.startTime)}
          </Text>

          <View className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 mb-5">
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-400">Venue</Text>
              <Text className="text-xs font-semibold text-slate-200">
                {booking.event.venue}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-400">Ticket Type</Text>
              <Text className="text-xs font-semibold text-slate-200">
                {booking.ticketType} ({booking.quantity}x)
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-400">Total Paid</Text>
              <Text className="text-xs font-bold text-indigo-400">
                {formatCurrency(booking.totalAmount)}
              </Text>
            </View>
          </View>

          {/* QR Code Placeholder */}
          <View className="bg-slate-950 border border-slate-800 rounded-2xl p-6 items-center justify-center">
            <Ionicons name="qr-code-outline" size={100} color="#818cf8" />
            <Text className="text-xs font-medium text-slate-400 mt-2">
              Present this code at event entrance
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          <PrimaryButton
            title="View Booking Details"
            onPress={() =>
              router.replace({
                pathname: '/booking/[id]',
                params: { id: booking.id },
              })
            }
          />
          <PrimaryButton
            title="Back to Home"
            variant="outline"
            onPress={() => router.replace('/(tabs)')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
