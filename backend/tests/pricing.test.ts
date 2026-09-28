import { describe, it, expect } from 'vitest';
import { computeTotals } from '../src/modules/bookings/pricing';

describe('Pricing Computation', () => {
  it('computes correct totals for General tier (base 50000 paise)', () => {
    const res = computeTotals(50000, 'General', 1);
    expect(res).toEqual({
      unit: 50000,
      subtotal: 50000,
      fee: 2500,    // 5% of 50000
      tax: 9450,    // 18% of (50000 + 2500) = 18% of 52500 = 9450
      total: 61950,
    });
  });

  it('computes correct totals for VIP tier (base 50000 paise, qty 2)', () => {
    const res = computeTotals(50000, 'VIP', 2);
    expect(res).toEqual({
      unit: 100000,   // 50000 x 2
      subtotal: 200000,
      fee: 10000,     // 5% of 200000
      tax: 37800,     // 18% of 210000
      total: 247800,
    });
  });

  it('returns all zeros for free event (base 0 paise)', () => {
    const res = computeTotals(0, 'General', 5);
    expect(res).toEqual({
      unit: 0,
      subtotal: 0,
      fee: 0,
      tax: 0,
      total: 0,
    });
  });

  it('rounds correctly for odd price numbers (base 9999 paise, qty 3)', () => {
    const res = computeTotals(9999, 'General', 3);
    // unit = 9999
    // subtotal = 9999 * 3 = 29997
    // fee = Math.round(29997 * 0.05) = Math.round(1499.85) = 1500
    // subtotal + fee = 31497
    // tax = Math.round(31497 * 0.18) = Math.round(5669.46) = 5669
    // total = 29997 + 1500 + 5669 = 37166
    expect(res).toEqual({
      unit: 9999,
      subtotal: 29997,
      fee: 1500,
      tax: 5669,
      total: 37166,
    });
  });
});
