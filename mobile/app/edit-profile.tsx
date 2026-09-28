import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { profileSchema } from '../utils/validation';
import { InputField } from '../components/ui/InputField';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { normalizeError } from '../utils/error';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, loading } = useAuthStore();
  const showToast = useUiStore((s) => s.showToast);

  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSave = async () => {
    setGeneralError(null);
    setFieldErrors({});

    const result = profileSchema.safeParse({ name, mobile });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    try {
      await updateProfile({ name: result.data.name, mobile: result.data.mobile });
      showToast('Profile updated successfully', 'success');
      router.back();
    } catch (err: any) {
      setGeneralError(normalizeError(err).message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="px-5 pt-12 pb-4 flex-row items-center border-b border-slate-900 bg-slate-950">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-100">
            Edit Profile
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {generalError && (
            <View className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-4 mb-4 flex-row items-center gap-3">
              <Ionicons name="alert-circle-outline" size={22} color="#f43f5e" />
              <Text className="text-rose-200 text-sm flex-1 font-medium">
                {generalError}
              </Text>
            </View>
          )}

          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6">
            <InputField
              label="Full Name"
              value={name}
              onChangeText={setName}
              error={fieldErrors.name}
              leftIcon="person-outline"
            />

            <InputField
              label="Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              error={fieldErrors.mobile}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            <InputField
              label="Email Address"
              value={user?.email || ''}
              onChangeText={() => {}}
              disabled
              leftIcon="mail-outline"
            />
            <Text className="text-xs text-slate-400 -mt-2 mb-4">
              Email address cannot be changed.
            </Text>

            <PrimaryButton
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              className="mt-2"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
