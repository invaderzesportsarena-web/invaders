-- Fix admin role checking functions to use both role sources
-- Update is_admin_secure to check profiles.role instead of user_roles for consistency

CREATE OR REPLACE FUNCTION public.is_admin_secure(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = uid 
    AND role IN ('admin', 'moderator')
  );
$$;

-- Update has_role function to also check profiles table for better compatibility
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  ) OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role::text = _role::text
  );
$$;

-- Create a unified admin check function that uses profiles table
CREATE OR REPLACE FUNCTION public.check_admin_role(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'moderator')
  );
$$;