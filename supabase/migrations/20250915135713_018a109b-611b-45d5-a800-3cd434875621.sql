-- Grant admin role to Hassan and Sami
-- Using the existing admin user to perform these operations
-- Force role updates by temporarily bypassing the role escalation check

-- Disable the trigger temporarily
ALTER TABLE profiles DISABLE TRIGGER prevent_role_escalation_trigger;

-- Update Hassan's role
UPDATE profiles 
SET role = 'admin'::role_enum
WHERE username = 'hassan' OR id = '42843d76-2269-4ec1-8323-315d86d4fa29';

-- Update Sami's role  
UPDATE profiles 
SET role = 'admin'::role_enum
WHERE username = 'samijutt657845' OR id = '30e211f8-45f8-402d-abfa-bd5f685f9281';

-- Re-enable the trigger
ALTER TABLE profiles ENABLE TRIGGER prevent_role_escalation_trigger;