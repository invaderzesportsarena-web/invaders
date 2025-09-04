/**
 * Utility functions for formatting and validating Z-Credits with decimal support
 */

export const formatZcreds = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};

export const parseZcreds = (value: string): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export const validateZcredInput = (value: string): boolean => {
  const regex = /^\d*\.?\d{0,2}$/;
  return regex.test(value) && parseFloat(value) >= 0;
};

export const formatZcredDisplay = (amount: number | string): string => {
  const formatted = formatZcreds(amount);
  return `${formatted} Z-Credits`;
};

export const formatPkrFromZcreds = (zcreds: number | string, exchangeRate: number = 1): string => {
  const num = typeof zcreds === 'string' ? parseFloat(zcreds) : zcreds;
  const pkr = num * exchangeRate;
  return `PKR ${pkr.toFixed(2)}`;
};