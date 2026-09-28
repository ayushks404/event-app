import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../store/notificationStore';
import { NotificationCard } from '../components/notification/NotificationCard';
import { LoadingIndicator } from '../components/ui/LoadingIndicator';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';

export default function NotificationsScreen() {
  const router = useRouter();

  const {
    items,
    unreadCount,
    loading,
    loadingMore,
    error,
    fetch: fetchNotifications,
    loadMore,
    markRead,
    markAllRead,
  } = useNotificationStore();

  const loadData = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleNotificationPress = async (item: any) => {
    if (!item.isRead) {
      void markRead(item.id);
    }
    if (item.eventId) {
      router.push(`/event/${item.eventId}`);
    } else if (item.bookingId) {
      router.push({
        pathname: '/booking/[id]',
        params: { id: item.bookingId },
      });
    }
  };

  if (loading && items.length === 0) {
    return <LoadingIndicator message="Fetching notifications..." />;
  }

  if (error && items.length === 0) {
    return (
      <ErrorState
        title="Failed to Load Notifications"
        message={error}
        onRetry={loadData}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1">
        {/* Header */}
        <View className="px-5 pt-12 pb-4 flex-row items-center justify-between border-b border-slate-900 bg-slate-950">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="#f8fafc" />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold text-slate-100">
                Notifications
              </Text>
              {unreadCount > 0 ? (
                <Text className="text-xs text-indigo-400 font-semibold">
                  {unreadCount} unread
                </Text>
              ) : (
                <Text className="text-xs text-slate-400">All caught up</Text>
              )}
            </View>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={() => markAllRead()}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30"
            >
              <Text className="text-xs font-bold text-indigo-400">
                Mark All Read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications List */}
        {items.length === 0 ? (
          <EmptyState
            title="No Notifications"
            subtitle="You don't have any notifications right now."
            icon="notifications-outline"
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32 }}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={loadData}
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
              <NotificationCard
                notification={item}
                onPress={() => handleNotificationPress(item)}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
