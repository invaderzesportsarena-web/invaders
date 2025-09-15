-- Fix critical security vulnerability: Remove public access to user profiles
-- This ensures only authenticated users can view their own profiles and admins can view all profiles

-- Drop any existing public read policies that might expose user data
DROP POLICY IF EXISTS profiles_read_public ON profiles;
DROP POLICY IF EXISTS profiles_public_read ON profiles;
DROP POLICY IF EXISTS public_read_profiles ON profiles;

-- Ensure we have the correct secure policies in place
-- First drop existing policies to recreate them with explicit security
DROP POLICY IF EXISTS profiles_read_self_or_admin ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;

-- Create secure policy for reading profiles (users can only read their own, admins can read all)
CREATE POLICY "profiles_read_self_or_admin" 
ON profiles 
FOR SELECT 
USING ((auth.uid() = id) OR is_admin(auth.uid()));

-- Create secure policy for inserting profiles (users can only insert their own)
CREATE POLICY "profiles_insert_own" 
ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create secure policy for updating profiles (users can only update their own)
CREATE POLICY "profiles_update_own" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add audit logging for profile access attempts to monitor for unauthorized access
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log profile access attempts (only for sensitive operations)
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL AND auth.uid() != COALESCE(NEW.id, OLD.id) AND NOT is_admin(auth.uid()) THEN
    PERFORM log_security_event(
      'unauthorized_profile_access_attempt',
      auth.uid(),
      null,
      jsonb_build_object(
        'table', 'profiles',
        'action', TG_OP,
        'target_profile_id', COALESCE(NEW.id, OLD.id),
        'accessing_user_id', auth.uid()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Note: SELECT triggers are not supported in PostgreSQL, so we'll rely on RLS policies for access control
-- and use application-level logging if needed for monitoring unauthorized access attempts