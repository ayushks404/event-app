import React, { useState } from 'react';
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  leftIcon,
  keyboardType = 'default',
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View className="mb-4">
      {label ? <Text className="font-semibold text-sm text-ink mb-1.5">{label}</Text> : null}
      <View
        className={`flex-row items-center bg-white border ${
          error ? 'border-danger' : 'border-line'
        } rounded-btn px-3 h-12 min-h-[44px]`}
      >
        {leftIcon ? <View className="mr-2.5">{leftIcon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          placeholderTextColor="#9CA3AF"
          className="flex-1 text-ink text-base h-full"
          {...props}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            className="p-1 min-h-[44px] min-w-[44px] items-center justify-center"
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
          >
            <Ionicons name={isSecure ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6B7280" />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text className="text-danger text-xs mt-1 font-normal">{error}</Text> : null}
    </View>
  );
};
