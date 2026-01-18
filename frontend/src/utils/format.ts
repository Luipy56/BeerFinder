/**
 * Formats a price value to a string with 2 decimal places
 * Handles both number and string inputs from the backend
 */
export const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) {
    return '0.00';
  }
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) {
    return '0.00';
  }
  return numPrice.toFixed(2);
};
