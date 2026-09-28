export function previewTotals(unitPrice: number, qty: number, p: { feeBps: number; taxBps: number }) {
  const unit = Math.round(unitPrice * 100);
  const subtotal = unit * qty;
  const fee = Math.round((subtotal * p.feeBps) / 10_000);
  const tax = Math.round(((subtotal + fee) * p.taxBps) / 10_000);
  return {
    unit: unit / 100,
    subtotal: subtotal / 100,
    fee: fee / 100,
    tax: tax / 100,
    total: (subtotal + fee + tax) / 100,
  };
}
