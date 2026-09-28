import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrganizerStore } from '../../store/organizerStore';
import { useDebounce } from '../../hooks/useDebounce';
import { AttendeeRow } from '../../components/organizer/AttendeeRow';
import { SearchBar } from '../../components/search/SearchBar';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { AttendeeDTO } from '../../types/models';

export default function EventAttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { attendeesByEvent, loading, error, fetchAttendees } = useOrganizerStore();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const attendees: AttendeeDTO[] = id && attendeesByEvent[id] ? attendeesByEvent[id] : [];

  const loadData = useCallback(async () => {
    if (!id) return;
    await fetchAttendees(id, debouncedQuery || undefined);
  }, [id, debouncedQuery, fetchAttendees]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  if (loading && attendees.length === 0) {
    return <LoadingIndicator message="Fetching attendee list..." />;
  }

  if (error && attendees.length === 0) {
    return (
      <ErrorState
        title="Failed to Load Attendees"
        message={error}
        onRetry={loadData}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1">
        {/* Header */}
        <View className="px-5 pt-12 pb-4 border-b border-slate-900 bg-slate-950">
          <View className="flex-row items-center gap-3 mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="#f8fafc" />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold text-slate-100">
                Event Attendees
              </Text>
              <Text className="text-xs text-indigo-400 font-semibold">
                {attendees.length} {attendees.length === 1 ? 'attendee' : 'attendees'} registered
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery('')}
            placeholder="Search attendee by name, email, mobile..."
          />
        </View>

        {/* Attendees List */}
        {attendees.length === 0 ? (
          <EmptyState
            title="No Attendees Found"
            subtitle={
              query
                ? 'No attendee records match your search criteria.'
                : 'No bookings have been made for this event yet.'
            }
            icon="people-outline"
          />
        ) : (
          <FlatList
            data={attendees}
            keyExtractor={(item) => item.bookingId}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32 }}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={handleRefresh}
                tintColor="#818cf8"
                colors={['#818cf8']}
              />
            }
            renderItem={({ item }) => <AttendeeRow attendee={item} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
