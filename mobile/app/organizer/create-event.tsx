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
import { useOrganizerStore } from '../../store/organizerStore';
import { useUiStore } from '../../store/uiStore';
import { eventFormSchema } from '../../utils/validation';
import { CATEGORIES } from '../../constants/categories';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Chip } from '../../components/ui/Chip';
import { normalizeError } from '../../utils/error';
import { Category } from '../../types/models';

export default function CreateEventScreen() {
  const router = useRouter();
  const createEvent = useOrganizerStore((s) => s.createEvent);
  const loading = useOrganizerStore((s) => s.loading);
  const showToast = useUiStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Music');
  const [image, setImage] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [ticketPrice, setTicketPrice] = useState('0');
  const [totalSeats, setTotalSeats] = useState('100');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleCreate = async () => {
    setGeneralError(null);
    setFieldErrors({});

    const result = eventFormSchema.safeParse({
      name,
      description,
      category,
      image,
      date,
      startTime,
      endTime,
      venue,
      address,
      ticketPrice,
      totalSeats,
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
      await createEvent({
        ...result.data,
        ticketPrice: Number(result.data.ticketPrice),
        totalSeats: Number(result.data.totalSeats),
        image: result.data.image || null,
      });
      showToast('Event created successfully', 'success');
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
            Create New Event
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {generalError && (
            <View className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-4 mb-5 flex-row items-center gap-3">
              <Ionicons name="alert-circle-outline" size={22} color="#f43f5e" />
              <Text className="text-rose-200 text-sm flex-1 font-medium">
                {generalError}
              </Text>
            </View>
          )}

          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6">
            <InputField
              label="Event Name"
              placeholder="e.g. Summer Music Festival 2026"
              value={name}
              onChangeText={setName}
              error={fieldErrors.name}
            />

            <InputField
              label="Description"
              placeholder="Provide event details, schedule, highlights..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              error={fieldErrors.description}
            />

            {/* Category Chips */}
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                />
              ))}
            </View>
            {fieldErrors.category ? (
              <Text className="text-rose-400 text-xs -mt-2 mb-4">{fieldErrors.category}</Text>
            ) : null}

            <InputField
              label="Banner Image URL (Optional)"
              placeholder="https://images.unsplash.com/..."
              value={image}
              onChangeText={setImage}
              autoCapitalize="none"
              error={fieldErrors.image}
            />

            <InputField
              label="Event Date (YYYY-MM-DD)"
              placeholder="2026-10-15"
              value={date}
              onChangeText={setDate}
              error={fieldErrors.date}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <InputField
                  label="Start Time (HH:MM)"
                  placeholder="18:00"
                  value={startTime}
                  onChangeText={setStartTime}
                  error={fieldErrors.startTime}
                />
              </View>
              <View className="flex-1">
                <InputField
                  label="End Time (HH:MM)"
                  placeholder="22:00"
                  value={endTime}
                  onChangeText={setEndTime}
                  error={fieldErrors.endTime}
                />
              </View>
            </View>

            <InputField
              label="Venue Name"
              placeholder="e.g. Grand Arena"
              value={venue}
              onChangeText={setVenue}
              error={fieldErrors.venue}
            />

            <InputField
              label="Address"
              placeholder="Full street address, city"
              value={address}
              onChangeText={setAddress}
              error={fieldErrors.address}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <InputField
                  label="Ticket Price (₹)"
                  placeholder="0"
                  value={ticketPrice}
                  onChangeText={setTicketPrice}
                  keyboardType="numeric"
                  error={fieldErrors.ticketPrice}
                />
              </View>
              <View className="flex-1">
                <InputField
                  label="Total Seats"
                  placeholder="100"
                  value={totalSeats}
                  onChangeText={setTotalSeats}
                  keyboardType="numeric"
                  error={fieldErrors.totalSeats}
                />
              </View>
            </View>

            <PrimaryButton
              title="Create Event"
              onPress={handleCreate}
              loading={loading}
              className="mt-4"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
