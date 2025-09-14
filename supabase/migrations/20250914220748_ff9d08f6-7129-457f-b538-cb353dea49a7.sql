-- Fix RLS security issue: Enable RLS on tournament_prizes table
ALTER TABLE public.tournament_prizes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tournament_prizes table
CREATE POLICY "tournament_prizes_read_all" 
ON public.tournament_prizes 
FOR SELECT 
USING (true);

CREATE POLICY "tournament_prizes_admin_all" 
ON public.tournament_prizes 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix database trigger issue: Update sync_withdrawal_amounts function
-- The console logs show "amount_zc" field errors, but the actual field is "amount_zcreds"
CREATE OR REPLACE FUNCTION public.sync_withdrawal_amounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update other security definer functions to fix search path warnings
CREATE OR REPLACE FUNCTION public.sync_deposit_amounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.calculate_zc_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.amount_zc := NEW.amount_pkr / (
    SELECT rate 
    FROM conversion_rate 
    ORDER BY effective_date DESC 
    LIMIT 1
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_negative_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  if new.balance < 0 then
    raise exception 'Insufficient Z-Creds';
  end if;
  return new;
end; 
$function$;

CREATE OR REPLACE FUNCTION public.guard_withdraw_2h()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
declare starts timestamptz;
begin
  if new.status = 'withdrawn' then
    select t.starts_at into starts from public.tournaments t where t.id = new.tournament_id;
    if starts is null or now() < (starts - interval '2 hours') then
      raise exception 'Cannot set withdrawn before T-2h window';
    end if;
  end if;
  return new;
end 
$function$;

CREATE OR REPLACE FUNCTION public.limit_deposit_rate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  if exists (
    select 1 from public.zcred_deposit_forms
    where user_id = new.user_id
      and created_at > now() - interval '60 seconds'
  ) then
    raise exception 'Too many deposit requests. Please wait 60 seconds.';
  end if;
  return new;
end 
$function$;

CREATE OR REPLACE FUNCTION public.limit_withdraw_rate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  if exists (
    select 1 from public.zcred_withdrawal_forms
    where user_id = new.user_id
      and created_at > now() - interval '60 seconds'
  ) then
    raise exception 'Too many withdrawal requests. Please wait 60 seconds.';
  end if;
  return new;
end 
$function$;