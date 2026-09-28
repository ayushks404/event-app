import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  tone,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const isDanger = destructive || tone === 'danger';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/70 items-center justify-center p-5">
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
          <Text className="font-bold text-xl text-slate-100 mb-2">{title}</Text>
          <Text className="font-normal text-sm text-slate-400 mb-6">{message}</Text>
          <View className="flex-row justify-end items-center gap-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="h-12 min-h-[44px] px-4 rounded-2xl items-center justify-center border border-slate-800 bg-slate-950"
            >
              <Text className="font-semibold text-slate-400 text-sm">{cancelLabel}</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <PrimaryButton
                title={confirmLabel}
                onPress={onConfirm}
                loading={loading}
                variant={isDanger ? 'danger' : 'primary'}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
