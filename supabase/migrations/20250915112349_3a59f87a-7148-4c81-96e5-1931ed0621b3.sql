-- Check ALL triggers on the profiles table to see what's still causing the issue
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_statement,
    t.action_timing
FROM information_schema.triggers t
WHERE t.event_object_table = 'profiles'
ORDER BY t.trigger_name;

-- Also check if there are any duplicate triggers that weren't dropped
SELECT 
    trigger_name,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
GROUP BY trigger_name
HAVING COUNT(*) > 1;