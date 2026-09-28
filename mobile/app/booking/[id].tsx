import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookingStore } from '../../store/bookingStore';
import { useUiStore } from '../../store/uiStore';
import { Badge } from '../../components/ui/Badge';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate, formatTime, formatCurrency } from '../../utils/format';
import { normalizeError } from '../../utils/error';
import { BookingDTO } from '../../types/models';

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const fetchOne = useBookingStore((s) => s.fetchOne);
  const cancel = useBookingStore((s) => s.cancel);
  const cancelling = useBookingStore((s) => s.cancelling);
  const showToast = useUiStore((s) => s.showToast);

  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancelVisible, setConfirmCancelVisible] = useState(false);

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

  const handleCancelBooking = async () => {
    if (!booking) return;
    try {
      const updated = await cancel(booking.id);
      setBooking(updated);
      setConfirmCancelVisible(false);
      showToast('Booking cancelled successfully', 'success');
    } catch (err: any) {
      setConfirmCancelVisible(false);
      showToast(normalizeError(err).message, 'error');
    }
  };

  if (loading && !booking) {
    return <LoadingIndicator message="Loading reservation details..." />;
  }

  if (error || !booking) {
    return (
      <ErrorState
        title="Booking Not Found"
        message={error || 'Could not find requested booking record.'}
        onRetry={loadBooking}
      />
    );
  }

  let tone: 'success' | 'danger' | 'muted' = 'success';
  let statusLabel = 'Upcoming';
  if (booking.phase === 'completed') {
    tone = 'muted';
    statusLabel = 'Completed';
  } else if (booking.phase === 'cancelled') {
    tone = 'danger';
    statusLabel = 'Cancelled';
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1">
        {/* Header */}
        <View className="px-5 pt-12 pb-4 flex-row items-center border-b border-slate-900 bg-slate-950">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={20} color="#f8fafc" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-100">
              Ticket Details
            </Text>
            <Text className="text-xs font-mono text-slate-400">
              {booking.bookingCode}
            </Text>
          </View>
          <Badge label={statusLabel} tone={tone} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 100 }}
        >
          {/* Digital QR Ticket Header */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6 items-center shadow-xl">
            <Text className="text-xs font-semibold uppercase text-slate-400 tracking-widest mb-2">
              Entry Pass Barcode
            </Text>

            <View className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full items-center justify-center mb-4">
              <Ionicons name="qr-code-outline" size={120} color="#818cf8" />
              <Text className="text-sm font-mono font-bold text-indigo-400 mt-2">
                {booking.bookingCode}
              </Text>
            </View>

            <Text className="text-xs text-slate-400 text-center">
              Scan at event entry. Created on {formatDate(booking.createdAt)}
            </Text>
          </View>

          {/* Event Info Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(`/event/${booking.event.id}`)}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="bg-indigo-600/20 px-3 py-1 rounded-full border border-indigo-500/30">
                <Text className="text-xs font-bold text-indigo-400 uppercase">
                  {booking.event.category}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-semibold text-indigo-400">View Event</Text>
                <Ionicons name="chevron-forward" size={14} color="#818cf8" />
              </View>
            </View>

            <Text className="text-lg font-bold text-slate-100 mb-2">
              {booking.event.name}
            </Text>

            <View className="space-y-2 mt-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar-outline" size={16} color="#818cf8" />
                <Text className="text-xs text-slate-300">
                  {formatDate(booking.event.date)} · {formatTime(booking.event.startTime)}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="location-outline" size={16} color="#818cf8" />
                <Text className="text-xs text-slate-300" numberOfLines={1}>
                  {booking.event.venue}, {booking.event.address}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Payment Breakdown Card */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6">
            <Text className="text-base font-bold text-slate-100 mb-4">
              Payment Summary
            </Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-slate-400">
                {booking.ticketType} Ticket x {booking.quantity}
              </Text>
              <Text className="text-sm font-semibold text-slate-200">
                {formatCurrency(booking.subtotal)}
              </Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-slate-400">Service Fee (5%)</Text>
              <Text className="text-sm font-semibold text-slate-200">
                {formatCurrency(booking.serviceFee)}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-sm text-slate-400">GST (18%)</Text>
              <Text className="text-sm font-semibold text-slate-200">
                {formatCurrency(booking.taxAmount)}
              </Text>
            </View>

            <View className="h-[1px] bg-slate-800 mb-3" />

            <View className="flex-row justify-between">
              <Text className="text-base font-bold text-slate-100">Total Paid</Text>
              <Text className="text-lg font-extrabold text-indigo-400">
                {formatCurrency(booking.totalAmount)}
              </Text>
            </View>
          </View>

          {/* Cancellation Notice or CTA */}
          {booking.canCancel ? (
            <View className="mt-2">
              <PrimaryButton
                title="Cancel Booking"
                variant="danger"
                onPress={() => setConfirmCancelVisible(true)}
              />
            </View>
          ) : booking.status === 'cancelled' ? (
            <View className="bg-rose-950/40 border border-rose-900/60 rounded-2xl p-4 items-center">
              <Text className="text-xs text-rose-300 text-center font-medium">
                This booking was cancelled on {booking.cancelledAt ? formatDate(booking.cancelledAt) : 'record'}.
              </Text>
            </View>
          ) : (
            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 items-center">
              <Text className="text-xs text-slate-400 text-center font-medium">
                Cancellation is unavailable for this booking (event in progress, completed, or starting within 2 hours).
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Confirmation Modal */}
        <ConfirmDialog
          visible={confirmCancelVisible}
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking? This will restore seats to the event and mark the ticket as cancelled."
          confirmLabel="Yes, Cancel Booking"
          cancelLabel="Keep Ticket"
          tone="danger"
          loading={cancelling}
          onConfirm={handleCancelBooking}
          onCancel={() => setConfirmCancelVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}
