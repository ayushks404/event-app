import { useEventStore } from '../store/eventStore';

export function useEventFilters() {
  const filters = useEventStore((state) => state.filters);

  let activeCount = 0;
  if (filters.category) activeCount++;
  if (filters.dateFrom) activeCount++;
  if (filters.dateTo) activeCount++;
  if (filters.location) activeCount++;
  if (filters.minPrice !== undefined) activeCount++;
  if (filters.maxPrice !== undefined) activeCount++;
  if (filters.available) activeCount++;

  return { filters, activeCount };
}
