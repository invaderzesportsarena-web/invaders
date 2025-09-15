-- Let's check the validate_financial_amount function and fix it
-- This function is likely trying to access amount_zcreds on the deposit table

-- First, let's see the current function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'validate_financial_amount';

-- Drop and recreate the function with correct field names
DROP FUNCTION IF EXISTS validate_financial_amount() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_financial_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- For deposit forms: check amount_zc (NOT amount_zcreds)
  IF TG_TABLE_NAME = 'zcred_deposit_forms' THEN
    IF NEW.amount_zc IS NOT NULL THEN
      IF NEW.amount_zc < 0 THEN
        RAISE EXCEPTION 'Amount cannot be negative';
      END IF;
      IF NEW.amount_zc::text ~ '\.\d{3,}' THEN
        RAISE EXCEPTION 'Amount cannot have more than 2 decimal places';
      END IF;
      IF NEW.amount_zc > 999999.99 THEN
        RAISE EXCEPTION 'Amount exceeds maximum limit';
      END IF;
    END IF;
  END IF;
  
  -- For withdrawal forms: check amount_zcreds
  IF TG_TABLE_NAME = 'zcred_withdrawal_forms' THEN
    IF NEW.amount_zcreds IS NOT NULL THEN
      IF NEW.amount_zcreds < 0 THEN
        RAISE EXCEPTION 'Amount cannot be negative';
      END IF;
      IF NEW.amount_zcreds::text ~ '\.\d{3,}' THEN
        RAISE EXCEPTION 'Amount cannot have more than 2 decimal places';
      END IF;
      IF NEW.amount_zcreds > 999999.99 THEN
        RAISE EXCEPTION 'Amount exceeds maximum limit';
      END IF;
    END IF;
  END IF;
  
  -- Validate PKR amounts (both tables have this)
  IF NEW.amount_pkr IS NOT NULL THEN
    IF NEW.amount_pkr < 0 THEN
      RAISE EXCEPTION 'PKR amount cannot be negative';
    END IF;
    IF NEW.amount_pkr > 99999999.99 THEN
      RAISE EXCEPTION 'PKR amount exceeds maximum limit';
    END IF;
  END IF;
  
  -- Validate money amounts (deposit table has this)
  IF NEW.amount_money IS NOT NULL THEN
    IF NEW.amount_money < 0 THEN
      RAISE EXCEPTION 'Money amount cannot be negative';
    END IF;
    IF NEW.amount_money > 99999999.99 THEN
      RAISE EXCEPTION 'Money amount exceeds maximum limit';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the triggers for both tables
CREATE TRIGGER validate_deposit_amounts
  BEFORE INSERT OR UPDATE ON zcred_deposit_forms
  FOR EACH ROW
  EXECUTE FUNCTION validate_financial_amount();

CREATE TRIGGER validate_withdrawal_amounts
  BEFORE INSERT OR UPDATE ON zcred_withdrawal_forms
  FOR EACH ROW
  EXECUTE FUNCTION validate_financial_amount();