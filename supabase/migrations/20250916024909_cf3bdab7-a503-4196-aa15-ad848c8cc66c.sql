-- Grant admin role to user saqibjshahid76@gmail.com
UPDATE profiles 
SET role = 'admin'::role_enum 
WHERE id = '3f25a429-5123-4bb2-b767-918ca1b81d20';

-- Also add to user_roles table for the role system
INSERT INTO user_roles (user_id, role) 
VALUES ('3f25a429-5123-4bb2-b767-918ca1b81d20', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;