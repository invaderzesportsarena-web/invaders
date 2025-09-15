-- Fix critical security vulnerability: Restrict banking information access to admin users only
-- This replaces the overly permissive policy that allowed any authenticated user to read sensitive banking data

-- Drop the existing vulnerable policy
DROP POLICY IF EXISTS acct_authenticated_read_active ON admin_account_details;

-- Create a secure policy that only allows admin users to read banking information
CREATE POLICY "acct_admin_read_only" 
ON admin_account_details 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Add audit logging for banking information access attempts
CREATE OR REPLACE FUNCTION public.audit_banking_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log all access attempts to banking information
  PERFORM log_security_event(
    'banking_info_access',
    auth.uid(),
    null,
    jsonb_build_object(
      'table', 'admin_account_details',
      'action', TG_OP,
      'record_id', COALESCE(NEW.id, OLD.id)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger to audit all banking information access
CREATE TRIGGER audit_banking_access_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON admin_account_details
  FOR EACH ROW EXECUTE FUNCTION audit_banking_access();