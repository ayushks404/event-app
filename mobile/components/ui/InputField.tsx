import React, { useState } from 'react';
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string | React.ReactNode;
  disabled?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  leftIcon,
  disabled = false,
  keyboardType = 'default',
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View className="mb-4">
      {label ? (
        <Text className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-1.5">
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center bg-slate-900 border ${
          error ? 'border-rose-500' : 'border-slate-800'
        } rounded-2xl px-3.5 h-12 ${disabled ? 'opacity-50 bg-slate-950' : ''}`}
      >
        {leftIcon ? (
          <View className="mr-2.5">
            {typeof leftIcon === 'string' ? (
              <Ionicons name={leftIcon as any} size={18} color="#64748b" />
            ) : (
              leftIcon
            )}
          </View>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          editable={!disabled}
          keyboardType={keyboardType}
          placeholderTextColor="#64748b"
          className="flex-1 text-slate-100 text-sm h-full"
          {...props}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            className="p-1 min-h-[44px] min-w-[44px] items-center justify-center"
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
          >
            <Ionicons name={isSecure ? 'eye-outline' : 'eye-off-outline'} size={20} color="#64748b" />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text className="text-rose-400 text-xs mt-1 font-medium">{error}</Text> : null}
    </View>
  );
};
