-- Step 2: Continue with the rest of the migration
-- Ensure conversion_rate table has proper data
INSERT INTO conversion_rate (rate, effective_date) 
VALUES (90.0, NOW())
ON CONFLICT DO NOTHING;

-- Ensure zcred_transactions has required columns for manual adjustments
ALTER TABLE zcred_transactions 
ADD COLUMN IF NOT EXISTS balance_after NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_zcred_tx_user_created 
ON zcred_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_zcred_tx_type_status 
ON zcred_transactions (type, status, created_at DESC);

-- Enable RLS on conversion_rate table
ALTER TABLE conversion_rate ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for conversion_rate (read-only for all authenticated users)
CREATE POLICY "conversion_rate_read_all" ON conversion_rate
FOR SELECT 
TO authenticated
USING (true);

-- Enable RLS on me table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'me') THEN
        ALTER TABLE me ENABLE ROW LEVEL SECURITY;
        
        -- Create basic RLS policy for me table
        CREATE POLICY "me_read_own" ON me
        FOR SELECT 
        TO authenticated
        USING (id = auth.uid());
    END IF;
END $$;