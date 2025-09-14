-- Update the conversion rate to 1 Z-Credit = 1 PKR
UPDATE conversion_rate SET rate = 1.00 WHERE id = (
  SELECT id FROM conversion_rate ORDER BY effective_date DESC LIMIT 1
);

-- If no conversion rate exists, insert one
INSERT INTO conversion_rate (rate, effective_date)
SELECT 1.00, now()
WHERE NOT EXISTS (SELECT 1 FROM conversion_rate);