-- Fix the validate_financial_amount trigger to handle different table structures
CREATE OR REPLACE FUNCTION public.validate_financial_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- For deposit forms: check amount_zc (NOT amount_zcreds) and amount_money
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
    
    -- Only check amount_money for deposit forms (withdrawal forms don't have this field)
    IF NEW.amount_money IS NOT NULL THEN
      IF NEW.amount_money < 0 THEN
        RAISE EXCEPTION 'Money amount cannot be negative';
      END IF;
      IF NEW.amount_money > 99999999.99 THEN
        RAISE EXCEPTION 'Money amount exceeds maximum limit';
      END IF;
    END IF;
  END IF;
  
  -- For withdrawal forms: check amount_zcreds (NOT amount_money which doesn't exist)
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
  
  RETURN NEW;
END;
$function$;