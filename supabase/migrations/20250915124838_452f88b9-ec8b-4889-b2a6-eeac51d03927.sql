-- Manually credit the 3 verified deposits that have valid amounts
-- Credit hassan's deposit (250 ZC)
INSERT INTO zcred_wallets (user_id, balance) 
VALUES ('42843d76-2269-4ec1-8323-315d86d4fa29', 0) 
ON CONFLICT (user_id) DO NOTHING;

UPDATE zcred_wallets 
SET balance = balance + 250, 
    updated_at = NOW()
WHERE user_id = '42843d76-2269-4ec1-8323-315d86d4fa29';

INSERT INTO zcred_transactions (
    user_id, 
    type, 
    amount, 
    balance_after, 
    reason, 
    reference, 
    status
) VALUES (
    '42843d76-2269-4ec1-8323-315d86d4fa29',
    'deposit',
    250,
    (SELECT balance FROM zcred_wallets WHERE user_id = '42843d76-2269-4ec1-8323-315d86d4fa29'),
    'deposit_credit',
    '1a335484-1481-479e-86a0-21fee055eedb',
    'approved'
);

-- Credit samijutt657845's deposit (200 ZC)
INSERT INTO zcred_wallets (user_id, balance) 
VALUES ('30e211f8-45f8-402d-abfa-bd5f685f9281', 0) 
ON CONFLICT (user_id) DO NOTHING;

UPDATE zcred_wallets 
SET balance = balance + 200, 
    updated_at = NOW()
WHERE user_id = '30e211f8-45f8-402d-abfa-bd5f685f9281';

INSERT INTO zcred_transactions (
    user_id, 
    type, 
    amount, 
    balance_after, 
    reason, 
    reference, 
    status
) VALUES (
    '30e211f8-45f8-402d-abfa-bd5f685f9281',
    'deposit',
    200,
    (SELECT balance FROM zcred_wallets WHERE user_id = '30e211f8-45f8-402d-abfa-bd5f685f9281'),
    'deposit_credit',
    '412d07b9-69d1-4766-a2f0-9090f54071e0',
    'approved'
);

-- Credit invaderzesportsarena's deposit (200 ZC)
INSERT INTO zcred_wallets (user_id, balance) 
VALUES ('79559c5b-215b-4684-9265-9582cd56811a', 0) 
ON CONFLICT (user_id) DO NOTHING;

UPDATE zcred_wallets 
SET balance = balance + 200, 
    updated_at = NOW()
WHERE user_id = '79559c5b-215b-4684-9265-9582cd56811a';

INSERT INTO zcred_transactions (
    user_id, 
    type, 
    amount, 
    balance_after, 
    reason, 
    reference, 
    status
) VALUES (
    '79559c5b-215b-4684-9265-9582cd56811a',
    'deposit',
    200,
    (SELECT balance FROM zcred_wallets WHERE user_id = '79559c5b-215b-4684-9265-9582cd56811a'),
    'deposit_credit',
    'de8060fa-27e5-42d4-9391-df72113f9f3e',
    'approved'
);

-- Create a trigger to automatically credit deposits when they are verified
CREATE OR REPLACE FUNCTION public.auto_credit_verified_deposit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_credits_to_add numeric;
    v_current_balance numeric;
    v_new_balance numeric;
BEGIN
    -- Only trigger when status changes to 'verified' and approved_credits is set
    IF TG_OP = 'UPDATE' AND OLD.status != 'verified' AND NEW.status = 'verified' THEN
        
        -- Get credits to add (use approved_credits if set, otherwise amount_zc)
        v_credits_to_add := COALESCE(NEW.approved_credits, NEW.amount_zc);
        
        -- Only proceed if we have a valid amount
        IF v_credits_to_add IS NOT NULL AND v_credits_to_add > 0 THEN
            
            -- Check if already credited (prevent double crediting)
            IF NOT EXISTS (
                SELECT 1 FROM zcred_transactions 
                WHERE reason = 'deposit_credit' 
                AND reference = NEW.id::text
            ) THEN
                
                -- Ensure user has a wallet
                INSERT INTO zcred_wallets (user_id, balance) 
                VALUES (NEW.user_id, 0) 
                ON CONFLICT (user_id) DO NOTHING;
                
                -- Get current balance
                SELECT balance INTO v_current_balance
                FROM zcred_wallets
                WHERE user_id = NEW.user_id;
                
                -- Handle case where user doesn't have a wallet yet
                IF v_current_balance IS NULL THEN
                    v_current_balance := 0;
                END IF;
                
                v_new_balance := v_current_balance + v_credits_to_add;
                
                -- Update wallet balance
                UPDATE zcred_wallets 
                SET balance = v_new_balance, 
                    updated_at = NOW()
                WHERE user_id = NEW.user_id;
                
                -- Create transaction record
                INSERT INTO zcred_transactions (
                    user_id, 
                    type, 
                    amount, 
                    balance_after, 
                    reason, 
                    reference, 
                    reviewed_by, 
                    reviewed_at,
                    status
                ) VALUES (
                    NEW.user_id,
                    'deposit',
                    v_credits_to_add,
                    v_new_balance,
                    'deposit_credit',
                    NEW.id::text,
                    NEW.reviewed_by,
                    NOW(),
                    'approved'
                );
                
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_credit_deposit_trigger ON zcred_deposit_forms;
CREATE TRIGGER auto_credit_deposit_trigger
    AFTER UPDATE ON zcred_deposit_forms
    FOR EACH ROW
    EXECUTE FUNCTION auto_credit_verified_deposit();