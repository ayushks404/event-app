import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrganizerStore } from '../../store/organizerStore';
import { useEventStore } from '../../store/eventStore';
import { useUiStore } from '../../store/uiStore';
import { eventFormSchema } from '../../utils/validation';
import { CATEGORIES } from '../../constants/categories';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Chip } from '../../components/ui/Chip';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { normalizeError } from '../../utils/error';
import { Category, EventDetailDTO } from '../../types/models';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const fetchDetail = useEventStore((s) => s.fetchDetail);
  const updateEvent = useOrganizerStore((s) => s.updateEvent);
  const loading = useOrganizerStore((s) => s.loading);
  const showToast = useUiStore((s) => s.showToast);

  const [event, setEvent] = useState<EventDetailDTO | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

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

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setInitLoading(true);
    setInitError(null);
    try {
      const data = await fetchDetail(id, { force: true });
      setEvent(data);
      setName(data.name);
      setDescription(data.description);
      setCategory(data.category);
      setImage(data.image || '');
      setDate(data.date);
      setStartTime(data.startTime);
      setEndTime(data.endTime);
      setVenue(data.venue);
      setAddress(data.address);
      setTicketPrice(String(data.ticketPrice));
      setTotalSeats(String(data.totalSeats));
    } catch (e: any) {
      setInitError(e?.message || 'Failed to load event details');
    } finally {
      setInitLoading(false);
    }
  }, [id, fetchDetail]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const handleUpdate = async () => {
    if (!id || !event) return;
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
      await updateEvent(id, {
        ...result.data,
        ticketPrice: Number(result.data.ticketPrice),
        totalSeats: Number(result.data.totalSeats),
        image: result.data.image || null,
      });
      showToast('Event updated successfully', 'success');
      router.back();
    } catch (err: any) {
      setGeneralError(normalizeError(err).message);
    }
  };

  if (initLoading && !event) {
    return <LoadingIndicator message="Loading event details..." />;
  }

  if (initError || !event) {
    return (
      <ErrorState
        title="Event Not Found"
        message={initError || 'Could not load event for editing.'}
        onRetry={loadEvent}
      />
    );
  }

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
            Edit Event
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
              value={name}
              onChangeText={setName}
              error={fieldErrors.name}
            />

            <InputField
              label="Description"
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

            <InputField
              label="Banner Image URL (Optional)"
              value={image}
              onChangeText={setImage}
              autoCapitalize="none"
              error={fieldErrors.image}
            />

            <InputField
              label="Event Date (YYYY-MM-DD)"
              value={date}
              onChangeText={setDate}
              error={fieldErrors.date}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <InputField
                  label="Start Time (HH:MM)"
                  value={startTime}
                  onChangeText={setStartTime}
                  error={fieldErrors.startTime}
                />
              </View>
              <View className="flex-1">
                <InputField
                  label="End Time (HH:MM)"
                  value={endTime}
                  onChangeText={setEndTime}
                  error={fieldErrors.endTime}
                />
              </View>
            </View>

            <InputField
              label="Venue Name"
              value={venue}
              onChangeText={setVenue}
              error={fieldErrors.venue}
            />

            <InputField
              label="Address"
              value={address}
              onChangeText={setAddress}
              error={fieldErrors.address}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <InputField
                  label="Ticket Price (₹)"
                  value={ticketPrice}
                  onChangeText={setTicketPrice}
                  keyboardType="numeric"
                  error={fieldErrors.ticketPrice}
                />
              </View>
              <View className="flex-1">
                <InputField
                  label="Total Seats"
                  value={totalSeats}
                  onChangeText={setTotalSeats}
                  keyboardType="numeric"
                  error={fieldErrors.totalSeats}
                />
              </View>
            </View>

            <PrimaryButton
              title="Save Changes"
              onPress={handleUpdate}
              loading={loading}
              className="mt-4"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
