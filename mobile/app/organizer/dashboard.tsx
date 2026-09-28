import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrganizerStore } from '../../store/organizerStore';
import { useUiStore } from '../../store/uiStore';
import { StatCard } from '../../components/organizer/StatCard';
import { Badge } from '../../components/ui/Badge';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate, formatTime, formatCurrency } from '../../utils/format';
import { normalizeError } from '../../utils/error';
import { OrganizerEventDTO } from '../../types/models';

export default function OrganizerDashboardScreen() {
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);

  const {
    dashboard,
    events,
    loading,
    error,
    fetchDashboard,
    fetchEvents,
    removeEvent,
  } = useOrganizerStore();

  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.all([fetchDashboard(), fetchEvents()]);
  }, [fetchDashboard, fetchEvents]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleConfirmDelete = async () => {
    if (!deleteEventId) return;
    setDeleting(true);
    try {
      const res = await removeEvent(deleteEventId);
      setDeleteEventId(null);
      if (res.action === 'deleted') {
        showToast('Event deleted successfully', 'success');
      } else {
        showToast(
          `Event cancelled. ${res.cancelledBookings} booking(s) notified.`,
          'info'
        );
      }
    } catch (err: any) {
      setDeleteEventId(null);
      showToast(normalizeError(err).message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !dashboard && events.length === 0) {
    return <LoadingIndicator message="Loading dashboard statistics..." />;
  }

  if (error && !dashboard && events.length === 0) {
    return (
      <ErrorState
        title="Dashboard Unavailable"
        message={error}
        onRetry={loadData}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1">
        {/* Top Header */}
        <View className="px-5 pt-12 pb-4 flex-row items-center justify-between border-b border-slate-900 bg-slate-950">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="#f8fafc" />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-extrabold text-slate-100">
                Organizer Hub
              </Text>
              <Text className="text-xs text-indigo-400 font-semibold">
                Event Management
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/organizer/create-event')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 flex-row items-center gap-1.5"
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Create Event</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadData}
              tintColor="#818cf8"
              colors={['#818cf8']}
            />
          }
        >
          {/* Dashboard Stats Overview Grid */}
          <View className="mb-6">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Performance Overview
            </Text>
            <View className="flex-row flex-wrap -m-1.5">
              <StatCard
                label="Total Events"
                value={dashboard?.totalEvents ?? 0}
                icon="calendar"
              />
              <StatCard
                label="Upcoming"
                value={dashboard?.upcomingEvents ?? 0}
                icon="time"
              />
              <StatCard
                label="Total Bookings"
                value={dashboard?.totalBookings ?? 0}
                icon="ticket"
              />
              <StatCard
                label="Total Attendees"
                value={dashboard?.totalAttendees ?? 0}
                icon="people"
              />
            </View>
          </View>

          {/* Managed Events Section Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-100">
              My Created Events ({events.length})
            </Text>
          </View>

          {events.length === 0 ? (
            <EmptyState
              title="No Events Created"
              subtitle="You haven't hosted any events yet. Create your first event to start accepting ticket bookings."
              icon="calendar-outline"
              actionLabel="Create First Event"
              onAction={() => router.push('/organizer/create-event')}
            />
          ) : (
            <View className="space-y-4">
              {events.map((event: OrganizerEventDTO) => (
                <View
                  key={event.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5"
                >
                  {/* Category & Status */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="bg-indigo-600/20 px-3 py-1 rounded-full border border-indigo-500/30">
                      <Text className="text-xs font-bold text-indigo-400 uppercase">
                        {event.category}
                      </Text>
                    </View>
                    <Badge
                      label={event.status === 'active' ? 'Active' : 'Cancelled'}
                      tone={event.status === 'active' ? 'success' : 'danger'}
                    />
                  </View>

                  <Text className="text-lg font-bold text-slate-100 mb-1">
                    {event.name}
                  </Text>
                  <Text className="text-xs text-slate-400 mb-3">
                    {formatDate(event.date)} · {formatTime(event.startTime)}
                  </Text>

                  {/* Seat Sales & Pricing Stats Bar */}
                  <View className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex-row items-center justify-between mb-4">
                    <View>
                      <Text className="text-[10px] uppercase font-bold text-slate-400">
                        Booked Seats
                      </Text>
                      <Text className="text-sm font-extrabold text-slate-100 mt-0.5">
                        {event.booked} / {event.totalSeats}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[10px] uppercase font-bold text-slate-400">
                        Base Price
                      </Text>
                      <Text className="text-sm font-extrabold text-indigo-400 mt-0.5">
                        {formatCurrency(event.ticketPrice)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/organizer/attendees',
                          params: { id: event.id },
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 flex-row items-center gap-1"
                    >
                      <Ionicons name="people-outline" size={14} color="#818cf8" />
                      <Text className="text-xs font-semibold text-slate-200">
                        Attendees
                      </Text>
                    </TouchableOpacity>

                    {event.status === 'active' && (
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: '/organizer/edit-event',
                            params: { id: event.id },
                          })
                        }
                        className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 flex-row items-center gap-1"
                      >
                        <Ionicons name="create-outline" size={14} color="#818cf8" />
                        <Text className="text-xs font-semibold text-slate-200">
                          Edit
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => setDeleteEventId(event.id)}
                      className="px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-900/60 flex-row items-center gap-1"
                    >
                      <Ionicons name="trash-outline" size={14} color="#f43f5e" />
                      <Text className="text-xs font-semibold text-rose-400">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          visible={Boolean(deleteEventId)}
          title="Delete or Cancel Event"
          message="If this event has no bookings, it will be deleted. If users have confirmed bookings, it will be marked as Cancelled and all attendees will receive notifications."
          confirmLabel="Proceed"
          cancelLabel="Cancel"
          tone="danger"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteEventId(null)}
        />
      </View>
    </SafeAreaView>
  );
}
