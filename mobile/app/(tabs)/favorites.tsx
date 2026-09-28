import React, { useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '../../store/favoritesStore';
import { EventCard } from '../../components/event/EventCard';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { EmptyState } from '../../components/ui/EmptyState';

export default function FavoritesScreen() {
  const router = useRouter();
  const { items, loading, fetch: fetchFavorites, toggle: toggleFavorite, isFavorite } =
    useFavoritesStore();

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  const handleRefresh = useCallback(async () => {
    await fetchFavorites();
  }, [fetchFavorites]);

  if (loading && items.length === 0) {
    return <LoadingIndicator message="Loading saved events..." />;
  }

  return (
    <View className="flex-1 bg-slate-950 pt-14">
      <View className="px-5 mb-4">
        <Text className="text-2xl font-extrabold text-slate-100">
          Saved Events
        </Text>
        <Text className="text-slate-400 text-xs mt-1">
          {items.length} {items.length === 1 ? 'event' : 'events'} bookmarked
        </Text>
      </View>

      {items.length === 0 ? (
        <EmptyState
          title="No Saved Events Yet"
          subtitle="Tap the heart icon on any event to keep track of events you like."
          icon="heart-outline"
          actionLabel="Browse Events"
          onAction={() => router.push('/(tabs)/explore')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor="#818cf8"
              colors={['#818cf8']}
            />
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              variant="vertical"
              isFavorite={isFavorite(item.id)}
              onPress={() => router.push(`/event/${item.id}`)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}
