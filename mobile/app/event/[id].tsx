import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { formatDate, formatTime, formatCurrency } from '../../utils/format';
import { SeatsBadge } from '../../components/event/SeatsBadge';
import { FavoriteButton } from '../../components/event/FavoriteButton';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { EventDetailDTO } from '../../types/models';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const fetchDetail = useEventStore((s) => s.fetchDetail);
  const detailLoading = useEventStore((s) => s.detailLoading);
  const { isFavorite, toggle: toggleFavorite } = useFavoritesStore();

  const [event, setEvent] = useState<EventDetailDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const data = await fetchDetail(id, { force: true });
      setEvent(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load event details');
    }
  }, [id, fetchDetail]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (detailLoading && !event) {
    return <LoadingIndicator message="Loading event details..." />;
  }

  if (error || !event) {
    return (
      <ErrorState
        title="Event Not Found"
        message={error || 'The requested event could not be found.'}
        onRetry={loadDetail}
      />
    );
  }

  const isOrganizer = user?.id === event.organizer.id;
  const isBookable = event.status === 'active' && !event.isSoldOut && !isOrganizer;

  let buttonText = 'Book Tickets';
  if (event.status === 'cancelled') buttonText = 'Event Cancelled';
  else if (event.isSoldOut) buttonText = 'Sold Out';
  else if (isOrganizer) buttonText = 'Organizing Event';

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={detailLoading}
              onRefresh={loadDetail}
              tintColor="#818cf8"
            />
          }
        >
          {/* Header Image Banner */}
          <View className="relative w-full h-72 bg-slate-900">
            {event.image && !imageError ? (
              <Image
                source={{ uri: event.image }}
                className="w-full h-full"
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-slate-900">
                <Ionicons name="image-outline" size={56} color="#475569" />
              </View>
            )}

            {/* Gradient Overlay */}
            <View className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950" />

            {/* Top Navigation Row */}
            <View className="absolute top-12 left-5 right-5 flex-row justify-between items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-slate-950/70 items-center justify-center border border-slate-800"
              >
                <Ionicons name="arrow-back" size={20} color="#f8fafc" />
              </TouchableOpacity>

              <FavoriteButton
                isFavorite={isFavorite(event.id)}
                onPress={() => toggleFavorite(event.id)}
              />
            </View>

            {/* Floating Badges */}
            <View className="absolute bottom-4 left-5 flex-row items-center gap-2">
              <View className="bg-indigo-600/90 px-3 py-1 rounded-full border border-indigo-500/50">
                <Text className="text-xs font-bold text-white uppercase tracking-wider">
                  {event.category}
                </Text>
              </View>
              <SeatsBadge
                availableSeats={event.availableSeats}
                isSoldOut={event.isSoldOut}
              />
            </View>
          </View>

          {/* Body Content */}
          <View className="px-5 pt-6">
            {/* Title */}
            <Text className="text-2xl font-extrabold text-slate-100 tracking-tight leading-8 mb-2">
              {event.name}
            </Text>

            {/* Organizer Row */}
            <View className="flex-row items-center gap-2 mb-6">
              <Ionicons name="person-circle-outline" size={20} color="#818cf8" />
              <Text className="text-sm text-slate-400 font-medium">
                Hosted by <Text className="text-indigo-400 font-semibold">{event.organizer.name}</Text>
              </Text>
            </View>

            {/* Date & Location Card */}
            <View className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 mb-6 space-y-4">
              <View className="flex-row items-start gap-3">
                <View className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 items-center justify-center">
                  <Ionicons name="calendar-outline" size={20} color="#818cf8" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Date & Time
                  </Text>
                  <Text className="text-base font-bold text-slate-100 mt-0.5">
                    {formatDate(event.date)}
                  </Text>
                  <Text className="text-sm text-slate-400 mt-0.5">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </Text>
                </View>
              </View>

              <View className="h-[1px] bg-slate-800/80" />

              <View className="flex-row items-start gap-3">
                <View className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 items-center justify-center">
                  <Ionicons name="location-outline" size={20} color="#818cf8" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Venue
                  </Text>
                  <Text className="text-base font-bold text-slate-100 mt-0.5">
                    {event.venue}
                  </Text>
                  <Text className="text-sm text-slate-400 mt-0.5">
                    {event.address}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-100 mb-2">
                About Event
              </Text>
              <Text className="text-slate-300 text-sm leading-6">
                {event.description}
              </Text>
            </View>

            {/* Ticket Tiers */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-100 mb-3">
                Ticket Options
              </Text>
              <View className="gap-3">
                {event.ticketTiers.map((tier) => (
                  <View
                    key={tier.type}
                    className="flex-row items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 rounded-xl bg-slate-800 items-center justify-center">
                        <Ionicons
                          name={tier.type === 'VIP' ? 'star' : 'ticket'}
                          size={16}
                          color={tier.type === 'VIP' ? '#f59e0b' : '#818cf8'}
                        />
                      </View>
                      <View>
                        <Text className="text-sm font-bold text-slate-100">
                          {tier.type} Ticket
                        </Text>
                        <Text className="text-xs text-slate-400">
                          {tier.type === 'VIP' ? 'Priority Access & Amenities' : 'Standard Admission'}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-base font-extrabold text-indigo-400">
                      {formatCurrency(tier.unitPrice)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom CTA Bar */}
        <View className="absolute bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 px-5 py-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-slate-400 font-medium">Starting from</Text>
            <Text className="text-xl font-extrabold text-indigo-400">
              {event.ticketPrice === 0 ? 'Free' : formatCurrency(event.ticketPrice)}
            </Text>
          </View>

          <View className="w-48">
            <PrimaryButton
              title={buttonText}
              disabled={!isBookable}
              onPress={() => {
                if (user) {
                  router.push({
                    pathname: '/event/booking',
                    params: { id: event.id },
                  });
                } else {
                  router.push('/(auth)/login');
                }
              }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
