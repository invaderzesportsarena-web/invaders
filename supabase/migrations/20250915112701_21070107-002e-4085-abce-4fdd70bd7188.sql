-- Let's see exactly what triggers are currently on the profiles table
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_statement,
    t.action_timing,
    t.action_condition
FROM information_schema.triggers t
WHERE t.event_object_table = 'profiles'
ORDER BY t.trigger_name;

-- Also check if the sanitize_text_input function is the correct one
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'sanitize_text_input' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');