-- Check and fix the sanitize_text_input function
-- It's likely trying to access team_name on all tables including profiles

-- Get the current function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'sanitize_text_input';

-- Drop and recreate with table-specific logic
DROP FUNCTION IF EXISTS sanitize_text_input() CASCADE;

CREATE OR REPLACE FUNCTION public.sanitize_text_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Sanitize team names (only for registrations table)
  IF TG_TABLE_NAME = 'registrations' AND NEW.team_name IS NOT NULL THEN
    NEW.team_name := regexp_replace(NEW.team_name, '[<>\"'';&]', '', 'g');
    NEW.team_name := trim(NEW.team_name);
    IF length(NEW.team_name) < 2 THEN
      RAISE EXCEPTION 'Team name must be at least 2 characters long';
    END IF;
  END IF;
  
  -- Sanitize display names (for profiles and other tables that have it)
  IF NEW.display_name IS NOT NULL THEN
    NEW.display_name := regexp_replace(NEW.display_name, '[<>\"'';&]', '', 'g');
    NEW.display_name := trim(NEW.display_name);
  END IF;
  
  -- Sanitize usernames (for profiles and other tables that have it)
  IF NEW.username IS NOT NULL THEN
    NEW.username := regexp_replace(NEW.username, '[^a-zA-Z0-9_]', '', 'g');
    NEW.username := lower(trim(NEW.username));
    IF length(NEW.username) < 3 THEN
      RAISE EXCEPTION 'Username must be at least 3 characters long';
    END IF;
  END IF;
  
  -- Sanitize in-game names (for profiles and other tables that have it)
  IF NEW.in_game_name IS NOT NULL THEN
    NEW.in_game_name := regexp_replace(NEW.in_game_name, '[<>\"'';&]', '', 'g');
    NEW.in_game_name := trim(NEW.in_game_name);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate triggers for both profiles and registrations
CREATE TRIGGER sanitize_profile_text
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_text_input();

CREATE TRIGGER sanitize_registration_text
  BEFORE INSERT OR UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_text_input();