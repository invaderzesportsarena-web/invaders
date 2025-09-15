-- Fix validate_tournament_entry function to use correct enum value
CREATE OR REPLACE FUNCTION public.validate_tournament_entry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Validate tournament is in correct state (use 'registration_open' instead of 'published')
  IF tournament_state != 'registration_open' THEN
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
$function$