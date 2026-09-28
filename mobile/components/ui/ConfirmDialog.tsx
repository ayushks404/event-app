import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/50 items-center justify-center p-5">
        <View className="bg-white rounded-card p-5 w-full max-w-sm shadow-lg">
          <Text className="font-semibold text-lg text-ink mb-2">{title}</Text>
          <Text className="font-normal text-sm text-muted mb-6">{message}</Text>
          <View className="flex-row justify-end space-x-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="h-12 min-h-[44px] px-4 rounded-btn items-center justify-center border border-line"
            >
              <Text className="font-semibold text-muted">Cancel</Text>
            </TouchableOpacity>
            <View className="ml-2 flex-1">
              <PrimaryButton
                title={confirmLabel}
                onPress={onConfirm}
                loading={loading}
                variant={destructive ? 'danger' : 'primary'}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
