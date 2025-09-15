-- Completely remove and recreate the sanitize function to ensure no old cached version
-- The issue might be that there's still an old version being executed

-- Drop everything related to text sanitization
DROP TRIGGER IF EXISTS sanitize_profile_text ON profiles CASCADE;
DROP TRIGGER IF EXISTS sanitize_registration_text ON registrations CASCADE;
DROP FUNCTION IF EXISTS sanitize_text_input() CASCADE;

-- Create a completely new function with a different approach
CREATE OR REPLACE FUNCTION public.sanitize_user_text_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only sanitize fields that exist on the current table
  -- Check if team_name column exists before trying to access it
  IF TG_TABLE_NAME = 'registrations' THEN
    -- Only for registrations table
    IF NEW.team_name IS NOT NULL THEN
      NEW.team_name := regexp_replace(NEW.team_name, '[<>\"'';&]', '', 'g');
      NEW.team_name := trim(NEW.team_name);
      IF length(NEW.team_name) < 2 THEN
        RAISE EXCEPTION 'Team name must be at least 2 characters long';
      END IF;
    END IF;
  END IF;
  
  -- For all tables - only sanitize if field exists
  IF TG_TABLE_NAME = 'profiles' THEN
    -- Profiles table specific sanitization
    IF NEW.display_name IS NOT NULL THEN
      NEW.display_name := regexp_replace(NEW.display_name, '[<>\"'';&]', '', 'g');
      NEW.display_name := trim(NEW.display_name);
    END IF;
    
    IF NEW.username IS NOT NULL THEN
      NEW.username := regexp_replace(NEW.username, '[^a-zA-Z0-9_]', '', 'g');
      NEW.username := lower(trim(NEW.username));
      IF length(NEW.username) < 3 THEN
        RAISE EXCEPTION 'Username must be at least 3 characters long';
      END IF;
    END IF;
    
    IF NEW.in_game_name IS NOT NULL THEN
      NEW.in_game_name := regexp_replace(NEW.in_game_name, '[<>\"'';&]', '', 'g');
      NEW.in_game_name := trim(NEW.in_game_name);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create new clean triggers
CREATE TRIGGER sanitize_profile_text_new
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_user_text_input();

CREATE TRIGGER sanitize_registration_text_new
  BEFORE INSERT OR UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_user_text_input();