-- Manually credit the 3 verified deposits that have valid amounts (using correct enum values)
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
    amount, 
    balance_after, 
    reason, 
    reference, 
    status
) VALUES (
    '42843d76-2269-4ec1-8323-315d86d4fa29',
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
    amount, 
    balance_after, 
    reason, 
    reference, 
    status
) VALUES (
    '30e211f8-45f8-402d-abfa-bd5f685f9281',
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
    amount, 
    balance_after, 
    reason, 
    reference, 
    status
) VALUES (
    '79559c5b-215b-4684-9265-9582cd56811a',
    200,
    (SELECT balance FROM zcred_wallets WHERE user_id = '79559c5b-215b-4684-9265-9582cd56811a'),
    'deposit_credit',
    'de8060fa-27e5-42d4-9391-df72113f9f3e',
    'approved'
);