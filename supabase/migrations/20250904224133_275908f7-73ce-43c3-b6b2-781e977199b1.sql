-- Ensure conversion_rate table has proper data
INSERT INTO conversion_rate (rate, effective_date) 
VALUES (90.0, NOW())
ON CONFLICT DO NOTHING;

-- Update zcred_transactions table to support manual adjustments
DO $$ 
BEGIN
    -- Add manual_adjustment type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'zt_type') THEN
        CREATE TYPE zt_type AS ENUM ('deposit_credit', 'withdrawal_payout', 'manual_adjustment', 'tournament_entry');
    ELSE
        -- Add manual_adjustment to existing enum if not present
        BEGIN
            ALTER TYPE zt_type ADD VALUE IF NOT EXISTS 'manual_adjustment';
        EXCEPTION WHEN duplicate_object THEN
            -- Value already exists, continue
        END;
    END IF;
END $$;

-- Ensure zcred_transactions has required columns for manual adjustments
ALTER TABLE zcred_transactions 
ADD COLUMN IF NOT EXISTS balance_after NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Update the type column to use the enum if it's not already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zcred_transactions' 
        AND column_name = 'type' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE zcred_transactions 
        ALTER COLUMN type TYPE zt_type USING type::zt_type;
    END IF;
END $$;

-- Create function for atomic manual Z-Credit adjustments
CREATE OR REPLACE FUNCTION public.manual_zcred_adjustment(
    p_user_id UUID,
    p_delta_zc NUMERIC,
    p_reason TEXT,
    p_reference TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL,
    p_allow_negative BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
    v_transaction_id UUID;
    v_admin_id UUID;
    v_result JSON;
BEGIN
    -- Get admin ID from session if not provided
    v_admin_id := COALESCE(p_admin_id, auth.uid());
    
    -- Check if user performing this action is admin
    IF NOT is_admin(v_admin_id) THEN
        RAISE EXCEPTION 'Only admins can perform manual Z-Credit adjustments';
    END IF;
    
    -- Validate inputs
    IF p_delta_zc = 0 THEN
        RAISE EXCEPTION 'Adjustment amount cannot be zero';
    END IF;
    
    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'Reason is required for manual adjustments';
    END IF;
    
    -- Lock the wallet row and get current balance
    INSERT INTO zcred_wallets (user_id, balance) 
    VALUES (p_user_id, 0) 
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT balance INTO v_current_balance
    FROM zcred_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Calculate new balance
    v_new_balance := v_current_balance + p_delta_zc;
    
    -- Check for negative balance
    IF NOT p_allow_negative AND v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient balance. Current: %, Adjustment: %, Result would be: %', 
                       v_current_balance, p_delta_zc, v_new_balance;
    END IF;
    
    -- Update wallet balance
    UPDATE zcred_wallets 
    SET balance = v_new_balance, 
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Insert transaction record
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
        p_user_id,
        'manual_adjustment',
        p_delta_zc,
        v_new_balance,
        p_reason,
        p_reference,
        v_admin_id,
        NOW(),
        'approved'
    ) RETURNING id INTO v_transaction_id;
    
    -- Return result
    v_result := json_build_object(
        'transaction_id', v_transaction_id,
        'user_id', p_user_id,
        'delta_amount', p_delta_zc,
        'previous_balance', v_current_balance,
        'new_balance', v_new_balance,
        'reason', p_reason,
        'reference', p_reference,
        'admin_id', v_admin_id
    );
    
    RETURN v_result;
END;
$$;

-- Create index for transaction queries
CREATE INDEX IF NOT EXISTS idx_zcred_tx_user_created 
ON zcred_transactions (user_id, created_at DESC);

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_zcred_tx_type_status 
ON zcred_transactions (type, status, created_at DESC);

-- Update RLS policies for manual adjustments
CREATE POLICY "manual_adjustment_read" ON zcred_transactions
FOR SELECT 
TO authenticated
USING (
    type = 'manual_adjustment' AND 
    (user_id = auth.uid() OR is_admin(auth.uid()))
);

-- Ensure proper minimum values are enforced via validation
CREATE OR REPLACE FUNCTION validate_deposit_minimum()
RETURNS TRIGGER AS $$
BEGIN
    -- Get latest exchange rate
    DECLARE 
        v_rate NUMERIC := (SELECT rate FROM conversion_rate ORDER BY effective_date DESC LIMIT 1);
        v_min_pkr NUMERIC := 180;
        v_min_zc NUMERIC := 2;
    BEGIN
        -- For deposits: minimum 180 PKR
        IF NEW.amount_money < v_min_pkr THEN
            RAISE EXCEPTION 'Minimum deposit amount is % PKR', v_min_pkr;
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_withdrawal_minimum()
RETURNS TRIGGER AS $$
BEGIN
    DECLARE 
        v_min_zc NUMERIC := 2;
    BEGIN
        -- For withdrawals: minimum 2 ZC
        IF NEW.amount_zcreds < v_min_zc THEN
            RAISE EXCEPTION 'Minimum withdrawal amount is % Z-Credits', v_min_zc;
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

-- Apply validation triggers
DROP TRIGGER IF EXISTS validate_deposit_minimum_trigger ON zcred_deposit_forms;
CREATE TRIGGER validate_deposit_minimum_trigger
    BEFORE INSERT OR UPDATE ON zcred_deposit_forms
    FOR EACH ROW EXECUTE FUNCTION validate_deposit_minimum();

DROP TRIGGER IF EXISTS validate_withdrawal_minimum_trigger ON zcred_withdrawal_forms;
CREATE TRIGGER validate_withdrawal_minimum_trigger
    BEFORE INSERT OR UPDATE ON zcred_withdrawal_forms
    FOR EACH ROW EXECUTE FUNCTION validate_withdrawal_minimum();