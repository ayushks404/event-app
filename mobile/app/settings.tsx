import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../constants/config';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1">
        <View className="px-5 pt-12 pb-4 flex-row items-center border-b border-slate-900 bg-slate-950">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-100">
            Settings & About
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* App Info Card */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 items-center mb-6 shadow-xl">
            <View className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 items-center justify-center mb-3">
              <Ionicons name="ticket-outline" size={36} color="#818cf8" />
            </View>
            <Text className="text-xl font-bold text-slate-100">
              Event Discovery & Booking
            </Text>
            <Text className="text-xs text-slate-400 mt-1">
              Version 1.0.0 (Production Release)
            </Text>
          </View>

          {/* System Info List */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 mb-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-slate-300">
                API Base URL
              </Text>
              <Text className="text-xs font-mono text-indigo-400">
                {API_URL}
              </Text>
            </View>

            <View className="h-[1px] bg-slate-800" />

            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-slate-300">
                Environment
              </Text>
              <Text className="text-xs font-bold text-emerald-400 uppercase">
                Active / Online
              </Text>
            </View>

            <View className="h-[1px] bg-slate-800" />

            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-slate-300">
                Security Standard
              </Text>
              <Text className="text-xs text-slate-400">
                JWT Auth + SecureStore
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
