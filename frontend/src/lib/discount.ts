export function getDiscountPercent(price: number | string, originalPrice?: number | string | null) {
  const current = Number(price);
  const original = Number(originalPrice);

  if (!originalPrice || isNaN(current) || isNaN(original)) return null;
  if (original <= current) return null;

  return Math.round(((original - current) / original) * 100);
}