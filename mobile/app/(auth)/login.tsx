import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { loginSchema } from '../../utils/validation';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { normalizeError } from '../../utils/error';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleLogin = async () => {
    useAuthStore.setState({ error: null });
    setGeneralError(null);
    setFieldErrors({});

    const result = loginSchema.safeParse({ email, password });
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
      await login(result.data.email, result.data.password);
      router.replace('/(tabs)');
    } catch (err) {
      setGeneralError(normalizeError(err).message);
    }
  };

  const fillDemoUser = () => {
    setEmail('standard@example.com');
    setPassword('Password123');
    setFieldErrors({});
    setGeneralError(null);
  };

  const fillDemoOrganizer = () => {
    setEmail('organizer@example.com');
    setPassword('Password123');
    setFieldErrors({});
    setGeneralError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-950"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        className="px-6 py-12"
      >
        {/* Header Branding */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-indigo-600/20 items-center justify-center border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-500/20">
            <Ionicons name="ticket-outline" size={36} color="#818cf8" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-100 tracking-tight text-center">
            Event Discovery
          </Text>
          <Text className="text-slate-400 text-sm mt-1 text-center">
            Sign in to discover events & book your tickets
          </Text>
        </View>

        {/* Form Container */}
        <View className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
          <Text className="text-xl font-bold text-slate-100 mb-6">Welcome Back</Text>

          {/* Error Banner */}
          {(generalError || error) && (
            <View className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-4 mb-4 flex-row items-center gap-3">
              <Ionicons name="alert-circle-outline" size={22} color="#f43f5e" />
              <Text className="text-rose-200 text-sm flex-1 font-medium">
                {generalError || error}
              </Text>
            </View>
          )}

          <InputField
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
            }}
            error={fieldErrors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
          />

          <InputField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
            }}
            error={fieldErrors.password}
            secureTextEntry
            leftIcon="lock-closed-outline"
          />

          <PrimaryButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            className="mt-2"
          />

          {/* Quick Demo Fill Buttons */}
          <View className="mt-6 pt-6 border-t border-slate-800">
            <Text className="text-xs font-semibold uppercase text-slate-400 text-center tracking-wider mb-3">
              Quick Demo Access
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={fillDemoUser}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 items-center flex-row justify-center gap-1.5"
              >
                <Ionicons name="person-outline" size={14} color="#94a3b8" />
                <Text className="text-xs font-medium text-slate-300">User Demo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={fillDemoOrganizer}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 items-center flex-row justify-center gap-1.5"
              >
                <Ionicons name="briefcase-outline" size={14} color="#94a3b8" />
                <Text className="text-xs font-medium text-slate-300">Organizer Demo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer Link */}
        <View className="flex-row justify-center items-center mt-8 gap-2">
          <Text className="text-slate-400 text-sm">Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text className="text-indigo-400 font-semibold text-sm">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
