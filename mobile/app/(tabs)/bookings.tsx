import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBookingStore } from '../../store/bookingStore';
import { BookingCard } from '../../components/booking/BookingCard';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { normalizeError } from '../../utils/error';
import { useUiStore } from '../../store/uiStore';

type BookingTab = 'upcoming' | 'completed' | 'cancelled';

export default function BookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');
  const showToast = useUiStore((s) => s.showToast);

  const { byTab, fetchTab, loadMore, cancel, cancelling } = useBookingStore();

  const tabState = byTab[activeTab];

  const loadCurrentTab = useCallback(
    async (reset = false) => {
      await fetchTab(activeTab, { reset });
    },
    [activeTab, fetchTab]
  );

  useEffect(() => {
    void loadCurrentTab(false);
  }, [loadCurrentTab]);

  const handleRefresh = useCallback(async () => {
    await loadCurrentTab(true);
  }, [loadCurrentTab]);

  // Cancel Confirmation Modal State
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);

  const handleConfirmCancel = async () => {
    if (!cancelBookingId) return;
    try {
      await cancel(cancelBookingId);
      setCancelBookingId(null);
      showToast('Booking cancelled successfully', 'success');
    } catch (err: any) {
      setCancelBookingId(null);
      showToast(normalizeError(err).message, 'error');
    }
  };

  const tabs: { key: BookingTab; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <View className="flex-1 bg-slate-950 pt-14">
      {/* Header */}
      <View className="px-5 mb-4">
        <Text className="text-2xl font-extrabold text-slate-100">
          My Bookings
        </Text>
      </View>

      {/* Segmented Tab Controls */}
      <View className="px-5 mb-4">
        <View className="flex-row bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          {tabs.map((t) => {
            const isSelected = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
                  isSelected ? 'bg-indigo-600' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main Content Area */}
      {tabState.loading && tabState.items.length === 0 ? (
        <LoadingIndicator message={`Fetching ${activeTab} bookings...`} />
      ) : tabState.error && tabState.items.length === 0 ? (
        <ErrorState
          title="Failed to Load Bookings"
          message={tabState.error}
          onRetry={() => loadCurrentTab(true)}
        />
      ) : tabState.items.length === 0 ? (
        <EmptyState
          title={`No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Bookings`}
          subtitle={
            activeTab === 'upcoming'
              ? 'You have no active upcoming event reservations.'
              : `No ${activeTab} booking records found.`
          }
          icon="ticket-outline"
          actionLabel={activeTab === 'upcoming' ? 'Browse Events' : undefined}
          onAction={() => router.push('/(tabs)/explore')}
        />
      ) : (
        <FlatList
          data={tabState.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={tabState.loading}
              onRefresh={handleRefresh}
              tintColor="#818cf8"
              colors={['#818cf8']}
            />
          }
          onEndReached={() => loadMore(activeTab)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            tabState.loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#818cf8" />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() =>
                router.push({
                  pathname: '/booking/[id]',
                  params: { id: item.id },
                })
              }
              onCancel={() => setCancelBookingId(item.id)}
            />
          )}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        visible={Boolean(cancelBookingId)}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This will restore available seats for the event."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Booking"
        tone="danger"
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelBookingId(null)}
      />
    </View>
  );
}
