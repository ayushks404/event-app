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
import { registerSchema } from '../../utils/validation';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { normalizeError } from '../../utils/error';
import { Role } from '../../types/models';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loading, error } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('user');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleRegister = async () => {
    useAuthStore.setState({ error: null });
    setGeneralError(null);
    setFieldErrors({});

    const result = registerSchema.safeParse({
      name,
      email,
      mobile,
      password,
      confirmPassword,
      role,
    });

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
      await register(result.data);
      router.replace('/(tabs)');
    } catch (err) {
      setGeneralError(normalizeError(err).message);
    }
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
        <View className="items-center mb-6">
          <View className="w-14 h-14 rounded-2xl bg-indigo-600/20 items-center justify-center border border-indigo-500/30 mb-3 shadow-lg shadow-indigo-500/20">
            <Ionicons name="person-add-outline" size={30} color="#818cf8" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-100 tracking-tight text-center">
            Create Account
          </Text>
          <Text className="text-slate-400 text-sm mt-1 text-center">
            Join to discover events or host your own
          </Text>
        </View>

        {/* Form Container */}
        <View className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
          {/* Role Selector */}
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Account Type
          </Text>
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => setRole('user')}
              className={`flex-1 py-3 px-4 rounded-xl border flex-row items-center justify-center gap-2 ${
                role === 'user'
                  ? 'bg-indigo-600/20 border-indigo-500'
                  : 'bg-slate-800/60 border-slate-700'
              }`}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={role === 'user' ? '#818cf8' : '#94a3b8'}
              />
              <Text
                className={`font-semibold text-sm ${
                  role === 'user' ? 'text-indigo-400' : 'text-slate-400'
                }`}
              >
                Attendee
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRole('organizer')}
              className={`flex-1 py-3 px-4 rounded-xl border flex-row items-center justify-center gap-2 ${
                role === 'organizer'
                  ? 'bg-indigo-600/20 border-indigo-500'
                  : 'bg-slate-800/60 border-slate-700'
              }`}
            >
              <Ionicons
                name="briefcase-outline"
                size={18}
                color={role === 'organizer' ? '#818cf8' : '#94a3b8'}
              />
              <Text
                className={`font-semibold text-sm ${
                  role === 'organizer' ? 'text-indigo-400' : 'text-slate-400'
                }`}
              >
                Organizer
              </Text>
            </TouchableOpacity>
          </View>

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
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
            }}
            error={fieldErrors.name}
            leftIcon="person-outline"
          />

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
            label="Mobile Number"
            placeholder="9876543210"
            value={mobile}
            onChangeText={(text) => {
              setMobile(text);
              if (fieldErrors.mobile) setFieldErrors((p) => ({ ...p, mobile: '' }));
            }}
            error={fieldErrors.mobile}
            keyboardType="phone-pad"
            leftIcon="call-outline"
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

          <InputField
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (fieldErrors.confirmPassword)
                setFieldErrors((p) => ({ ...p, confirmPassword: '' }));
            }}
            error={fieldErrors.confirmPassword}
            secureTextEntry
            leftIcon="shield-checkmark-outline"
          />

          <PrimaryButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            className="mt-2"
          />
        </View>

        {/* Footer Link */}
        <View className="flex-row justify-center items-center mt-6 gap-2">
          <Text className="text-slate-400 text-sm">Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-indigo-400 font-semibold text-sm">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
