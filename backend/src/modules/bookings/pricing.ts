import { FEE_BPS, TAX_BPS, TIER_MULTIPLIERS } from '../../constants/pricing';

export function computeTotals(basePaise: number, tier: keyof typeof TIER_MULTIPLIERS, qty: number) {
  const unit     = Math.round(basePaise * TIER_MULTIPLIERS[tier]);
  const subtotal = unit * qty;
  const fee      = Math.round((subtotal * FEE_BPS) / 10_000);
  const tax      = Math.round(((subtotal + fee) * TAX_BPS) / 10_000);
  return { unit, subtotal, fee, tax, total: subtotal + fee + tax };
}
