-- Let's see exactly what triggers are currently active on deposit forms
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_statement,
    t.action_timing
FROM information_schema.triggers t
WHERE t.event_object_table = 'zcred_deposit_forms'
ORDER BY t.trigger_name;