-- Fix validate_phone_number function to handle registrations table correctly
CREATE OR REPLACE FUNCTION public.validate_phone_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Handle different tables with different phone field names
  IF TG_TABLE_NAME = 'profiles' THEN
    -- Validate Pakistani phone numbers (basic format) for profiles table
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
  END IF;
  
  IF TG_TABLE_NAME = 'registrations' THEN
    -- Validate Pakistani phone numbers for registrations table
    IF NEW.contact_phone IS NOT NULL AND NEW.contact_phone != '' THEN
      IF NOT (NEW.contact_phone ~ '^(\+92|0)?[0-9]{10,11}$') THEN
        RAISE EXCEPTION 'Invalid contact phone format. Use Pakistani format: +92XXXXXXXXXX or 03XXXXXXXXX';
      END IF;
    END IF;
    
    IF NEW.whatsapp_number IS NOT NULL AND NEW.whatsapp_number != '' THEN
      IF NOT (NEW.whatsapp_number ~ '^(\+92|0)?[0-9]{10,11}$') THEN
        RAISE EXCEPTION 'Invalid WhatsApp number format. Use Pakistani format: +92XXXXXXXXXX or 03XXXXXXXXX';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$