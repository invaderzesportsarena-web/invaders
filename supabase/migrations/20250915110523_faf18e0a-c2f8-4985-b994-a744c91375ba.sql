-- Let's check for any remaining problematic triggers and completely clean them up
-- Also create a default conversion rate since the logs show conversion rate errors

-- First, create a default conversion rate if none exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM conversion_rate) THEN
        INSERT INTO conversion_rate (rate, effective_date) VALUES (90, NOW());
    END IF;
END
$$;

-- List all triggers on our tables to see what exists
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table IN ('zcred_deposit_forms', 'zcred_withdrawal_forms')
ORDER BY t.event_object_table, t.trigger_name;