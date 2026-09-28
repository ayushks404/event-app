import { format, parse, formatDistanceToNow } from 'date-fns';

/** ₹ with Indian digit grouping; no Intl dependency (Hermes-safe). */
export function formatCurrency(n: number): string {
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return `${n < 0 ? '-' : ''}₹${grouped}${dec === '00' ? '' : `.${dec}`}`;
}

export const formatDate = (d: string) => {
  try {
    return format(parse(d, 'yyyy-MM-dd', new Date()), 'EEE, d MMM yyyy');
  } catch {
    return d;
  }
};

export const formatTime = (t: string) => {
  try {
    return format(parse(t.slice(0, 5), 'HH:mm', new Date()), 'h:mm a');
  } catch {
    return t;
  }
};

export const formatTimeRange = (s: string, e: string) => `${formatTime(s)} – ${formatTime(e)}`;

export const relativeTime = (iso: string) => {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
};

// Picker output -> strings from LOCAL parts. Never use toISOString() for dates (shifts the day).
export const toDateString = (d: Date) => format(d, 'yyyy-MM-dd');
export const toTimeString = (d: Date) => format(d, 'HH:mm');
