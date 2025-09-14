-- SECURITY FIX: Implement proper role system and secure registrations table
-- This addresses the security issue with phone numbers and WhatsApp details being potentially accessible

-- Step 1: Create proper role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
    END IF;
END $$;

-- Step 2: Create user_roles table with proper structure
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Step 3: Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for user_roles table
CREATE POLICY "user_roles_admin_all" 
ON public.user_roles 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'moderator')
    )
);

CREATE POLICY "user_roles_read_own" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Step 5: Create secure function to check roles (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 6: Create updated is_admin function using the new role system
CREATE OR REPLACE FUNCTION public.is_admin_secure(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(uid, 'admin'::app_role) OR public.has_role(uid, 'moderator'::app_role);
$$;

-- Step 7: Drop existing problematic RLS policies on registrations table
DROP POLICY IF EXISTS "regs admin update" ON public.registrations;
DROP POLICY IF EXISTS "regs read own or admin" ON public.registrations;

-- Step 8: Create new secure RLS policies for registrations table
CREATE POLICY "registrations_admin_all" 
ON public.registrations 
FOR ALL 
USING (public.is_admin_secure(auth.uid()))
WITH CHECK (public.is_admin_secure(auth.uid()));

CREATE POLICY "registrations_read_own" 
ON public.registrations 
FOR SELECT 
USING (captain_id = auth.uid());

CREATE POLICY "registrations_insert_own" 
ON public.registrations 
FOR INSERT 
WITH CHECK (
    captain_id = auth.uid() 
    AND EXISTS (
        SELECT 1 FROM tournaments t
        WHERE t.id = registrations.tournament_id 
        AND now() < COALESCE(t.reg_closes_at, t.starts_at)
    )
);

-- Step 8: Migrate existing admin users to new role system
-- Find users with admin/moderator roles in profiles and add them to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 
       CASE 
           WHEN role = 'admin' THEN 'admin'::app_role
           WHEN role = 'moderator' THEN 'moderator'::app_role
           ELSE 'user'::app_role
       END
FROM public.profiles 
WHERE role IN ('admin', 'moderator')
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 9: Update the old is_admin function to use the new secure system temporarily for backward compatibility
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_secure(uid);
$$;