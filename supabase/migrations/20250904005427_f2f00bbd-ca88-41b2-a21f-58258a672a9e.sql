-- CRITICAL SECURITY FIXES

-- 1. Fix profiles UPDATE policy to prevent role escalation
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;

-- Create new policy that excludes role column updates
CREATE POLICY "profiles update own (no role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id AND OLD.role = NEW.role);

-- Create separate policy for admin role updates only
CREATE POLICY "profiles admin role update" 
ON public.profiles 
FOR UPDATE 
USING (is_admin(auth.uid())) 
WITH CHECK (is_admin(auth.uid()));

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
  -- Additional security: only allow existing admins to make other users admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can promote users to admin';
  END IF;
  
  UPDATE public.profiles 
  SET role = 'admin'
  WHERE id = target_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.setup_admin_account()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    admin_user_id uuid;
    admin_email text := 'admin@invaderz.com';
    result_text text;
BEGIN
    -- Check if admin account already exists
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_user_id IS NOT NULL THEN
        -- Update existing user to admin
        UPDATE public.profiles 
        SET role = 'admin'
        WHERE id = admin_user_id;
        
        result_text := 'Admin account updated: ' || admin_email;
    ELSE
        result_text := 'Admin account needs to be created manually: ' || admin_email;
    END IF;
    
    RETURN result_text;
END;
$function$;