-- Security Enhancement Migration: Add server-side validation, audit trails, and monitoring

-- 1. Enhanced input validation triggers for critical financial data
CREATE OR REPLACE FUNCTION validate_financial_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate Z-Credit amounts (must be positive, max 2 decimal places)
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
  
  -- Validate PKR amounts
  IF NEW.amount_pkr IS NOT NULL THEN
    IF NEW.amount_pkr < 0 THEN
      RAISE EXCEPTION 'PKR amount cannot be negative';
    END IF;
    IF NEW.amount_pkr > 99999999.99 THEN
      RAISE EXCEPTION 'PKR amount exceeds maximum limit';
    END IF;
  END IF;
  
  -- Validate money amounts
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
$$ LANGUAGE plpgsql;

-- Apply financial validation to relevant tables
CREATE TRIGGER validate_deposit_amounts
  BEFORE INSERT OR UPDATE ON zcred_deposit_forms
  FOR EACH ROW EXECUTE FUNCTION validate_financial_amount();

CREATE TRIGGER validate_withdrawal_amounts
  BEFORE INSERT OR UPDATE ON zcred_withdrawal_forms
  FOR EACH ROW EXECUTE FUNCTION validate_financial_amount();

CREATE TRIGGER validate_transaction_amounts
  BEFORE INSERT OR UPDATE ON zcred_transactions
  FOR EACH ROW EXECUTE FUNCTION validate_financial_amount();

-- 2. Phone number validation function
CREATE OR REPLACE FUNCTION validate_phone_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate Pakistani phone numbers (basic format)
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    IF NOT (NEW.phone ~ '^(\+92|0)?[0-9]{10,11}$') THEN
      RAISE EXCEPTION 'Invalid phone number format. Use Pakistani format: +92XXXXXXXXXX or 03XXXXXXXXX';
    END IF;
  END IF;
  
  IF NEW.whatsapp IS NOT NULL AND NEW.whatsapp != '' THEN
    IF NOT (NEW.whatsapp ~ '^(\+92|0)?[0-9]{10,11}$') THEN
      RAISE EXCEPTION 'Invalid WhatsApp number format. Use Pakistani format: +92XXXXXXXXXX or 03XXXXXXXXX';
    END IF;
  END IF;
  
  IF NEW.whatsapp_number IS NOT NULL AND NEW.whatsapp_number != '' THEN
    IF NOT (NEW.whatsapp_number ~ '^(\+92|0)?[0-9]{10,11}$') THEN
      RAISE EXCEPTION 'Invalid WhatsApp number format. Use Pakistani format: +92XXXXXXXXXX or 03XXXXXXXXX';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply phone validation to profiles
CREATE TRIGGER validate_profile_phones
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION validate_phone_number();

-- Apply phone validation to registrations
CREATE TRIGGER validate_registration_phones
  BEFORE INSERT OR UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION validate_phone_number();

-- 3. Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "audit_read_admin_only" ON admin_audit_log
  FOR SELECT USING (is_admin(auth.uid()));

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action_type TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enhanced audit triggers for critical tables
CREATE OR REPLACE FUNCTION audit_zcred_transactions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_admin_action(
      'transaction_status_change',
      'zcred_transactions',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_transaction_changes
  AFTER UPDATE ON zcred_transactions
  FOR EACH ROW EXECUTE FUNCTION audit_zcred_transactions();

-- Audit deposit form approvals/rejections
CREATE OR REPLACE FUNCTION audit_deposit_actions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_admin_action(
      'deposit_status_change',
      'zcred_deposit_forms',
      NEW.id,
      jsonb_build_object(
        'status', OLD.status,
        'approved_credits', OLD.approved_credits
      ),
      jsonb_build_object(
        'status', NEW.status,
        'approved_credits', NEW.approved_credits,
        'reviewed_by', NEW.reviewed_by
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_deposit_changes
  AFTER UPDATE ON zcred_deposit_forms
  FOR EACH ROW EXECUTE FUNCTION audit_deposit_actions();

-- Audit withdrawal form approvals/rejections
CREATE OR REPLACE FUNCTION audit_withdrawal_actions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_admin_action(
      'withdrawal_status_change',
      'zcred_withdrawal_forms',
      NEW.id,
      jsonb_build_object(
        'status', OLD.status,
        'approved_credits', OLD.approved_credits
      ),
      jsonb_build_object(
        'status', NEW.status,
        'approved_credits', NEW.approved_credits,
        'reviewed_by', NEW.reviewed_by
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_withdrawal_changes
  AFTER UPDATE ON zcred_withdrawal_forms
  FOR EACH ROW EXECUTE FUNCTION audit_withdrawal_actions();

-- 5. Security monitoring table for failed login attempts
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  email TEXT,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read security events
CREATE POLICY "security_events_admin_only" ON security_events
  FOR SELECT USING (is_admin(auth.uid()));

-- Function to log security events (to be called from edge functions)
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO security_events (
    event_type,
    user_id,
    email,
    details
  ) VALUES (
    p_event_type,
    p_user_id,
    p_email,
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enhanced tournament entry validation
CREATE OR REPLACE FUNCTION validate_tournament_entry()
RETURNS TRIGGER AS $$
DECLARE
  tournament_state t_state;
  registration_closes timestamptz;
  tournament_starts timestamptz;
BEGIN
  -- Get tournament details
  SELECT state, reg_closes_at, starts_at 
  INTO tournament_state, registration_closes, tournament_starts
  FROM tournaments 
  WHERE id = NEW.tournament_id;
  
  -- Validate tournament is in correct state
  IF tournament_state != 'published' THEN
    RAISE EXCEPTION 'Tournament is not open for registration';
  END IF;
  
  -- Validate registration window
  IF registration_closes IS NOT NULL AND now() > registration_closes THEN
    RAISE EXCEPTION 'Registration period has ended';
  END IF;
  
  IF tournament_starts IS NOT NULL AND now() > tournament_starts THEN
    RAISE EXCEPTION 'Tournament has already started';
  END IF;
  
  -- Check for duplicate registrations
  IF EXISTS (
    SELECT 1 FROM registrations 
    WHERE tournament_id = NEW.tournament_id 
    AND captain_id = NEW.captain_id 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'You have already registered for this tournament';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_tournament_registration
  BEFORE INSERT OR UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION validate_tournament_entry();

-- 7. Input sanitization for text fields
CREATE OR REPLACE FUNCTION sanitize_text_input()
RETURNS TRIGGER AS $$
BEGIN
  -- Sanitize team names (remove potential XSS)
  IF NEW.team_name IS NOT NULL THEN
    NEW.team_name := regexp_replace(NEW.team_name, '[<>\"'';&]', '', 'g');
    NEW.team_name := trim(NEW.team_name);
    IF length(NEW.team_name) < 2 THEN
      RAISE EXCEPTION 'Team name must be at least 2 characters long';
    END IF;
  END IF;
  
  -- Sanitize display names
  IF NEW.display_name IS NOT NULL THEN
    NEW.display_name := regexp_replace(NEW.display_name, '[<>\"'';&]', '', 'g');
    NEW.display_name := trim(NEW.display_name);
  END IF;
  
  -- Sanitize usernames (alphanumeric and underscore only)
  IF NEW.username IS NOT NULL THEN
    NEW.username := regexp_replace(NEW.username, '[^a-zA-Z0-9_]', '', 'g');
    NEW.username := lower(trim(NEW.username));
    IF length(NEW.username) < 3 THEN
      RAISE EXCEPTION 'Username must be at least 3 characters long';
    END IF;
  END IF;
  
  -- Sanitize in-game names
  IF NEW.in_game_name IS NOT NULL THEN
    NEW.in_game_name := regexp_replace(NEW.in_game_name, '[<>\"'';&]', '', 'g');
    NEW.in_game_name := trim(NEW.in_game_name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply text sanitization to profiles
CREATE TRIGGER sanitize_profile_text
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sanitize_text_input();

-- Apply text sanitization to registrations
CREATE TRIGGER sanitize_registration_text
  BEFORE INSERT OR UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION sanitize_text_input();