-- Check which triggers are on the profiles table that might cause this
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_statement,
    t.action_timing
FROM information_schema.triggers t
WHERE t.event_object_table = 'profiles'
ORDER BY t.trigger_name;