import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useEventStore } from '../../store/eventStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useNotificationStore } from '../../store/notificationStore';
import { CATEGORIES } from '../../constants/categories';
import { EventCard } from '../../components/event/EventCard';
import { CategoryCard } from '../../components/event/CategoryCard';
import { SearchBar } from '../../components/search/SearchBar';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Category } from '../../types/models';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { featured, upcoming, loading, error, fetchHome, applyFilters } =
    useEventStore();
  const { isFavorite, toggle: toggleFavorite, fetch: fetchFavorites } = useFavoritesStore();
  const { unreadCount, pollUnread } = useNotificationStore();

  const loadData = useCallback(async () => {
    await Promise.all([fetchHome(), fetchFavorites(), pollUnread()]);
  }, [fetchHome, fetchFavorites, pollUnread]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCategorySelect = (cat: Category) => {
    applyFilters({ category: cat });
    router.push('/(tabs)/explore');
  };

  const handleSearchFocus = () => {
    router.push('/(tabs)/explore');
  };

  if (loading && featured.length === 0 && upcoming.length === 0) {
    return <LoadingIndicator message="Loading discovery feed..." />;
  }

  if (error && featured.length === 0 && upcoming.length === 0) {
    return (
      <ErrorState
        title="Failed to Load Events"
        message={error}
        onRetry={loadData}
      />
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            tintColor="#818cf8"
            colors={['#818cf8']}
          />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Top Header */}
        <View className="px-5 pt-14 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              {user ? `Welcome back` : 'Discover'}
            </Text>
            <Text className="text-2xl font-extrabold text-slate-100 mt-0.5">
              {user ? `${user.name} 👋` : 'Event Discovery'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 items-center justify-center relative"
          >
            <Ionicons name="notifications-outline" size={22} color="#94a3b8" />
            {unreadCount > 0 && (
              <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-900" />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar Quick Entrance */}
        <View className="px-5 mb-6">
          <TouchableOpacity activeOpacity={0.9} onPress={handleSearchFocus}>
            <View pointerEvents="none">
              <SearchBar
                value=""
                onChangeText={() => {}}
                placeholder="Search events, venues, organizers..."
                onFilterPress={() => router.push('/(tabs)/explore')}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Categories Horizontal Scroll */}
        <View className="mb-8">
          <View className="px-5 mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-100">Categories</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text className="text-xs font-semibold text-indigo-400">See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat}
                category={cat}
                onPress={() => handleCategorySelect(cat)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Events Carousel */}
        {featured.length > 0 && (
          <View className="mb-8">
            <View className="px-5 mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-100">Featured Events</Text>
              <Text className="text-xs text-slate-400">Handpicked for you</Text>
            </View>
            <FlatList
              data={featured}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              renderItem={({ item }) => (
                <EventCard
                  event={item}
                  variant="horizontal"
                  isFavorite={isFavorite(item.id)}
                  onPress={() => router.push(`/event/${item.id}`)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                />
              )}
            />
          </View>
        )}

        {/* Upcoming Events List */}
        <View className="px-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-100">Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text className="text-xs font-semibold text-indigo-400">View All</Text>
            </TouchableOpacity>
          </View>

          {upcoming.length === 0 ? (
            <EmptyState
              title="No Upcoming Events"
              subtitle="Check back soon for new events or explore categories."
              icon="calendar-outline"
            />
          ) : (
            upcoming.map((item) => (
              <EventCard
                key={item.id}
                event={item}
                variant="vertical"
                isFavorite={isFavorite(item.id)}
                onPress={() => router.push(`/event/${item.id}`)}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
