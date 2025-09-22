/**
 * Utility functions for handling conversion rates
 */

import { supabase } from "@/integrations/supabase/client";

interface ConversionRate {
  rate: number;
  effective_date: string;
}

let cachedRate: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getLatestConversionRate = async (): Promise<number> => {
  // Return cached rate if still valid
  if (cachedRate && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedRate;
  }

  try {
    const { data, error } = await supabase
      .from('conversion_rate')
      .select('rate')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching conversion rate:', error);
// Fallback to 1:1 rate
      return 1;
    }

    cachedRate = data.rate;
    cacheTimestamp = Date.now();
    return data.rate;
  } catch (error) {
    console.error('Error fetching conversion rate:', error);
// Fallback to 1:1 rate
    return 1;
  }
};

export const convertPkrToZc = (pkrAmount: number, rate: number): number => {
  return pkrAmount / rate;
};

export const convertZcToPkr = (zcAmount: number, rate: number): number => {
  return zcAmount * rate;
};

export const formatCurrency = (amount: number, currency: 'PKR' | 'ZC' = 'ZC'): string => {
  if (currency === 'PKR') {
    return `PKR ${amount.toFixed(2)}`;
  }
  return `${amount.toFixed(2)} ZC`;
};

// Minimum amounts based on requirements  
export const MIN_DEPOSIT_PKR = 120;
export const MIN_WITHDRAWAL_ZC = 150;

export const validateDepositAmount = (pkrAmount: number): boolean => {
  return pkrAmount >= MIN_DEPOSIT_PKR;
};

export const validateWithdrawalAmount = (zcAmount: number): boolean => {
  return zcAmount >= MIN_WITHDRAWAL_ZC;
};