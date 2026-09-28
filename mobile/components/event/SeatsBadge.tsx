import React from 'react';
import { Badge } from '../ui/Badge';

interface SeatsBadgeProps {
  availableSeats: number;
  isSoldOut: boolean;
}

export const SeatsBadge: React.FC<SeatsBadgeProps> = ({ availableSeats, isSoldOut }) => {
  if (isSoldOut || availableSeats === 0) {
    return <Badge label="Sold Out" tone="danger" />;
  }
  if (availableSeats <= 10) {
    return <Badge label={`Only ${availableSeats} left`} tone="warning" />;
  }
  return <Badge label={`${availableSeats} seats`} tone="muted" />;
};
