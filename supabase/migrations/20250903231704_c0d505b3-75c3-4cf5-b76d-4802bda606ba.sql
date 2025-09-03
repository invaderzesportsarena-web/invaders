-- Create a function to setup admin account with specific credentials
CREATE OR REPLACE FUNCTION public.setup_admin_account()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_user_id uuid;
    admin_email text := 'admin@invaderz.com';
    result_text text;
BEGIN
    -- Check if admin account already exists
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_user_id IS NOT NULL THEN
        -- Update existing user to admin
        UPDATE profiles 
        SET role = 'admin'
        WHERE id = admin_user_id;
        
        result_text := 'Admin account updated: ' || admin_email;
    ELSE
        result_text := 'Admin account needs to be created manually: ' || admin_email;
    END IF;
    
    RETURN result_text;
END;
$$;

-- Execute the function
SELECT public.setup_admin_account();

-- Also ensure current user has admin access
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
    SELECT id FROM profiles 
    WHERE username IN ('markgpt971', 'invaderzesportsarena')
);

-- Create a view to easily check admin users
CREATE OR REPLACE VIEW admin_users AS
SELECT 
    p.id,
    p.username,
    p.display_name,
    p.role,
    u.email,
    p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role IN ('admin', 'moderator')
ORDER BY p.created_at DESC;