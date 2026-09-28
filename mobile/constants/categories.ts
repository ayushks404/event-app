import { Category } from '../types/models';

export const CATEGORIES = [
  'Music',
  'Sports',
  'Technology',
  'Business',
  'Education',
  'Workshops',
  'Entertainment',
] as const;

export const CATEGORY_ICONS: Record<Category, string> = {
  Music: 'musical-notes',
  Sports: 'basketball',
  Technology: 'laptop',
  Business: 'briefcase',
  Education: 'school',
  Workshops: 'construct',
  Entertainment: 'film',
};
