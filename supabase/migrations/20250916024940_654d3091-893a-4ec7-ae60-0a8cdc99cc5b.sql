-- Create a special function to set up the first admin user (bypasses role protection)
CREATE OR REPLACE FUNCTION setup_first_admin(target_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id uuid;
    result_text text;
BEGIN
    -- Find user by email from auth.users (need to join with profiles)
    SELECT p.id INTO target_user_id 
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', target_email;
    END IF;
    
    -- Update role in profiles table (bypassing trigger)
    UPDATE profiles 
    SET role = 'admin'::role_enum 
    WHERE id = target_user_id;
    
    -- Add to user_roles table
    INSERT INTO user_roles (user_id, role) 
    VALUES (target_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    result_text := 'Successfully granted admin role to user: ' || target_email || ' (ID: ' || target_user_id || ')';
    
    RETURN result_text;
END;
$$;

-- Grant admin role to saqibjshahid76@gmail.com
SELECT setup_first_admin('saqibjshahid76@gmail.com');