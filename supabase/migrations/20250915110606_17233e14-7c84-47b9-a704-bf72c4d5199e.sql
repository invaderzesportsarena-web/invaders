-- Check the problematic function and fix it
-- The calculate_zc_amount function might be referencing amount_zcreds instead of amount_zc

-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS trg_calculate_deposit_zc ON zcred_deposit_forms;
DROP FUNCTION IF EXISTS calculate_zc_amount() CASCADE;

-- We don't need this function anymore since sync_deposit_amounts already handles conversions
-- But if needed, here's the corrected version:
CREATE OR REPLACE FUNCTION public.calculate_zc_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Use amount_zc for deposits, not amount_zcreds
  NEW.amount_zc := NEW.amount_pkr / (
    SELECT rate 
    FROM conversion_rate 
    ORDER BY effective_date DESC 
    LIMIT 1
  );
  RETURN NEW;
END;
$function$;