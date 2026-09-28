import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useDebounce } from '../../hooks/useDebounce';
import { CATEGORIES } from '../../constants/categories';
import { EventCard } from '../../components/event/EventCard';
import { SearchBar } from '../../components/search/SearchBar';
import { FilterModal } from '../../components/search/FilterModal';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Category, EventFilters } from '../../types/models';

export default function ExploreScreen() {
  const router = useRouter();

  const {
    list,
    query,
    filters,
    loading,
    loadingMore,
    hasMore,
    error,
    setQuery,
    search,
    loadMore,
    applyFilters,
    clearFilters,
  } = useEventStore();

  const { isFavorite, toggle: toggleFavorite, fetch: fetchFavorites } = useFavoritesStore();

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Trigger search on debounced query change
  useEffect(() => {
    void search();
  }, [debouncedQuery]);

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([search(), fetchFavorites()]);
  }, [search, fetchFavorites]);

  const handleCategoryToggle = (cat: Category) => {
    if (filters.category === cat) {
      const { category, ...rest } = filters;
      applyFilters(rest);
    } else {
      applyFilters({ ...filters, category: cat });
    }
  };

  const hasActiveFilters =
    Boolean(filters.category) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.location) ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    Boolean(filters.available);

  return (
    <View className="flex-1 bg-slate-950 pt-14">
      {/* Top Header & Search Bar */}
      <View className="px-5 mb-4">
        <Text className="text-2xl font-extrabold text-slate-100 mb-4">
          Explore Events
        </Text>

        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <SearchBar
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
              placeholder="Search by title, location, category..."
            />
          </View>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            className={`w-12 h-12 rounded-2xl items-center justify-center border relative ${
              hasActiveFilters
                ? 'bg-indigo-600 border-indigo-500'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={hasActiveFilters ? '#ffffff' : '#94a3b8'}
            />
            {hasActiveFilters && (
              <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 border border-indigo-600" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories Bar */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = filters.category === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => handleCategoryToggle(cat)}
                className={`px-4 py-2 rounded-full border mr-2 flex-row items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-500'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-indigo-400' : 'text-slate-400'
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {loading && list.length === 0 ? (
        <LoadingIndicator message="Searching events..." />
      ) : error && list.length === 0 ? (
        <ErrorState
          title="Search Failed"
          message={error}
          onRetry={search}
        />
      ) : list.length === 0 ? (
        <EmptyState
          title="No Events Found"
          subtitle={
            query || hasActiveFilters
              ? 'Try changing your search keywords or clearing filters.'
              : 'No upcoming events available at the moment.'
          }
          icon="search-outline"
          actionLabel={hasActiveFilters || query ? 'Clear All Filters' : undefined}
          onAction={clearFilters}
        />
      ) : (
        <FlatList
          data={list}
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#818cf8" />
              </View>
            ) : null
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

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        initial={filters}
        onApply={(newFilters: EventFilters) => applyFilters(newFilters)}
        onClose={() => setFilterModalVisible(false)}
        onClear={clearFilters}
      />
    </View>
  );
}
