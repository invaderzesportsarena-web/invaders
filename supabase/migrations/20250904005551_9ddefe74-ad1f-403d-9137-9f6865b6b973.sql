-- CRITICAL SECURITY FIXES (CORRECTED)

-- 1. Fix profiles UPDATE policy to prevent role escalation
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;

-- Create new policy that allows updates but prevents role changes by regular users
CREATE POLICY "profiles update own" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Create a separate function to handle role updates securely
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only admins can change roles
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  -- Validate role value
  IF new_role NOT IN ('player', 'admin', 'moderator') THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;
  
  UPDATE public.profiles 
  SET role = new_role::role_enum
  WHERE id = target_user_id;
END;
$function$;

-- 2. Add RLS policies to admin_users table (currently has none)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users admin only" 
ON public.admin_users 
FOR ALL 
USING (is_admin(auth.uid())) 
WITH CHECK (is_admin(auth.uid()));

-- 3. Add RLS policies to zcred_balances table (currently has none)
ALTER TABLE public.zcred_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zcred_balances read own or admin" 
ON public.zcred_balances 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "zcred_balances admin manage" 
ON public.zcred_balances 
FOR ALL 
USING (is_admin(auth.uid())) 
WITH CHECK (is_admin(auth.uid()));

-- 4. Update database functions to have proper search_path settings
CREATE OR REPLACE FUNCTION public.guard_withdraw_2h()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
end $function$;

CREATE OR REPLACE FUNCTION public.limit_deposit_rate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
end $function$;

CREATE OR REPLACE FUNCTION public.limit_withdraw_rate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
end $function$;

CREATE OR REPLACE FUNCTION public.make_user_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Use the new secure role update function
  PERFORM public.update_user_role(target_user_id, 'admin');
END;
$function$;