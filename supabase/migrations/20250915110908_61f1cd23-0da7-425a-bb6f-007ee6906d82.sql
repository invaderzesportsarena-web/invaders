-- Update conversion rate to 1 ZC = 1 PKR
UPDATE conversion_rate 
SET rate = 1, effective_date = NOW() 
WHERE id = (SELECT id FROM conversion_rate ORDER BY effective_date DESC LIMIT 1);

-- If no rate exists, insert one
INSERT INTO conversion_rate (rate, effective_date) 
SELECT 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM conversion_rate);