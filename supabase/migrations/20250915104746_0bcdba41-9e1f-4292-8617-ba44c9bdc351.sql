-- Fix all database triggers that reference incorrect field names

-- Drop existing triggers that might be causing issues
DROP TRIGGER IF EXISTS sync_deposit_amounts_trigger ON zcred_deposit_forms;
DROP TRIGGER IF EXISTS sync_withdrawal_amounts_trigger ON zcred_withdrawal_forms;

-- Recreate the sync_deposit_amounts function with correct field names
CREATE OR REPLACE FUNCTION public.sync_deposit_amounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rate numeric := (SELECT rate FROM conversion_rate ORDER BY effective_date DESC LIMIT 1);
BEGIN
  -- If PKR provided (and ZC missing or wrong), compute ZC
  IF NEW.amount_pkr IS NOT NULL THEN
    NEW.amount_zc := ROUND(NEW.amount_pkr / v_rate, 2);
  END IF;

  -- If ZC provided (and PKR missing or wrong), compute PKR
  IF NEW.amount_zc IS NOT NULL AND (NEW.amount_pkr IS NULL OR NEW.amount_pkr = 0) THEN
    NEW.amount_pkr := ROUND(NEW.amount_zc * v_rate, 2);
  END IF;

  -- Default currency to PKR if empty
  IF NEW.currency IS NULL OR NEW.currency = '' THEN
    NEW.currency := 'PKR';
  END IF;

  RETURN NEW;
END;
$function$;

-- Recreate the sync_withdrawal_amounts function with correct field names
CREATE OR REPLACE FUNCTION public.sync_withdrawal_amounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rate numeric := (SELECT rate FROM conversion_rate ORDER BY effective_date DESC LIMIT 1);
BEGIN
  -- If ZC provided, compute PKR  
  IF NEW.amount_zcreds IS NOT NULL THEN
    NEW.amount_pkr := ROUND(NEW.amount_zcreds * v_rate, 2);
  END IF;

  -- If only PKR provided for some reason, back-compute ZC
  IF (NEW.amount_zcreds IS NULL OR NEW.amount_zcreds = 0) AND NEW.amount_pkr IS NOT NULL THEN
    NEW.amount_zcreds := ROUND(NEW.amount_pkr / v_rate, 2);
  END IF;

  RETURN NEW;
END;
$function$;

-- Create triggers with correct names
CREATE TRIGGER sync_deposit_amounts_trigger
  BEFORE INSERT OR UPDATE ON zcred_deposit_forms
  FOR EACH ROW
  EXECUTE FUNCTION sync_deposit_amounts();

CREATE TRIGGER sync_withdrawal_amounts_trigger
  BEFORE INSERT OR UPDATE ON zcred_withdrawal_forms
  FOR EACH ROW
  EXECUTE FUNCTION sync_withdrawal_amounts();