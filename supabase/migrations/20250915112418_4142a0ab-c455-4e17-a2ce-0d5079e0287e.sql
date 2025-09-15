-- Clean up duplicate triggers on profiles table
-- The issue is that there are duplicate triggers, and one might be using the old function

-- Drop ALL triggers on profiles table first
DROP TRIGGER IF EXISTS sanitize_profile_text ON profiles;
DROP TRIGGER IF EXISTS validate_profile_phones ON profiles;
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON profiles;

-- List what triggers remain
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_statement,
    t.action_timing
FROM information_schema.triggers t
WHERE t.event_object_table = 'profiles'
ORDER BY t.trigger_name;

-- Recreate clean triggers (only one of each)
CREATE TRIGGER sanitize_profile_text
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_text_input();

CREATE TRIGGER validate_profile_phones
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_phone_number();

CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();