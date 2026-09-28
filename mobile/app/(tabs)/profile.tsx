import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const handleLogout = async () => {
    setLogoutDialogVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 }}
      >
        <Text className="text-2xl font-extrabold text-slate-100 mb-6">
          Account Profile
        </Text>

        {/* User Info Header Card */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6 flex-row items-center gap-4 shadow-xl">
          <View className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 items-center justify-center">
            <Text className="text-2xl font-extrabold text-indigo-400">
              {getInitials(user?.name || '')}
            </Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-xl font-bold text-slate-100" numberOfLines={1}>
                {user?.name || 'Guest User'}
              </Text>
              <Badge
                label={user?.role === 'organizer' ? 'Organizer' : 'Attendee'}
                tone={user?.role === 'organizer' ? 'primary' : 'success'}
              />
            </View>
            <Text className="text-xs text-slate-400" numberOfLines={1}>
              {user?.email || 'Not logged in'}
            </Text>
            {user?.mobile ? (
              <Text className="text-xs text-slate-400 mt-0.5">
                📱 +91 {user.mobile}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Organizer Quick Entrance Banner */}
        {user?.role === 'organizer' && (
          <TouchableOpacity
            onPress={() => router.push('/organizer/dashboard')}
            className="bg-indigo-600/20 border border-indigo-500/40 rounded-3xl p-5 mb-6 flex-row items-center justify-between shadow-lg"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-2xl bg-indigo-600/40 items-center justify-center">
                <Ionicons name="briefcase" size={20} color="#818cf8" />
              </View>
              <View>
                <Text className="text-base font-bold text-slate-100">
                  Organizer Dashboard
                </Text>
                <Text className="text-xs text-indigo-300">
                  Manage events, view bookings & attendees
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#818cf8" />
          </TouchableOpacity>
        )}

        {/* Account Settings Menu List */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden mb-8">
          <TouchableOpacity
            onPress={() => router.push('/edit-profile')}
            className="p-4 flex-row items-center justify-between border-b border-slate-800/80"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="person-outline" size={20} color="#94a3b8" />
              <Text className="text-base font-semibold text-slate-200">
                Edit Profile
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            className="p-4 flex-row items-center justify-between border-b border-slate-800/80"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="notifications-outline" size={20} color="#94a3b8" />
              <Text className="text-base font-semibold text-slate-200">
                Notifications
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {unreadCount > 0 && (
                <View className="bg-rose-500 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-white">
                    {unreadCount}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/settings')}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="settings-outline" size={20} color="#94a3b8" />
              <Text className="text-base font-semibold text-slate-200">
                Settings & About
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={() => setLogoutDialogVisible(true)}
          className="bg-rose-950/40 border border-rose-900/60 rounded-2xl p-4 flex-row items-center justify-center gap-2"
        >
          <Ionicons name="log-out-outline" size={20} color="#f43f5e" />
          <Text className="text-base font-bold text-rose-400">
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Logout Dialog */}
        <ConfirmDialog
          visible={logoutDialogVisible}
          title="Sign Out"
          message="Are you sure you want to sign out of your account?"
          confirmLabel="Sign Out"
          cancelLabel="Cancel"
          tone="danger"
          onConfirm={handleLogout}
          onCancel={() => setLogoutDialogVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
