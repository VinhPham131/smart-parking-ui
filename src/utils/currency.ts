/** Format a number as Vietnamese currency with ₫ symbol. e.g. 1,000 ₫ */
export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

/** Format a number as short Vietnamese currency with đ suffix. e.g. 1,000đ */
export function formatAmountShort(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ'
}

/** Format a number as full VND currency via Intl (e.g. for analytics). */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}
