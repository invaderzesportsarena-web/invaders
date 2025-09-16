-- Use existing admin functions to grant admin role to saqibjshahid76@gmail.com
-- This assumes there's already an admin user who can execute this

-- Grant admin role using the existing secure function
SELECT public.update_user_role(
  (SELECT id FROM profiles p JOIN auth.users u ON u.id = p.id WHERE u.email = 'saqibjshahid76@gmail.com'),
  'admin'
);

-- Also add to user_roles table if it exists
INSERT INTO user_roles (user_id, role) 
SELECT p.id, 'admin'::app_role
FROM profiles p 
JOIN auth.users u ON u.id = p.id 
WHERE u.email = 'saqibjshahid76@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;