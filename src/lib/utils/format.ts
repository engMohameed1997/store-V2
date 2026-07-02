export function formatPrice(price: number | string | undefined | null): string {
  if (price === undefined || price === null) return "0";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "0";
  const rounded = Math.round(num);
  if (rounded < 1000) return "0";
  return rounded.toLocaleString("en-US");
}
