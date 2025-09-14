-- Clear all Z-Credit related data
DELETE FROM zcred_transactions;
DELETE FROM zcred_deposit_forms;
DELETE FROM zcred_withdrawal_forms;
DELETE FROM zcred_wallets;
DELETE FROM orders;
DELETE FROM order_items;

-- Clear existing content
DELETE FROM posts;
DELETE FROM products;
DELETE FROM tournaments;
DELETE FROM tournament_prizes;
DELETE FROM registrations;
DELETE FROM results_media;

-- Insert dummy tournaments
INSERT INTO tournaments (id, title, game, format, state, entry_fee_credits, slots, starts_at, reg_starts_at, reg_closes_at, rules_md, cover_url) VALUES
(gen_random_uuid(), 'PUBG Mobile Championship 2024', 'PUBG Mobile', 'single_elim', 'registration', 100, 64, NOW() + INTERVAL '7 days', NOW(), NOW() + INTERVAL '5 days', '# Tournament Rules\n\n## Game Settings\n- TPP Squad Mode\n- Custom Room\n- 4 Matches Total\n\n## Prize Distribution\n- 1st Place: 5000 Z-Credits\n- 2nd Place: 3000 Z-Credits\n- 3rd Place: 2000 Z-Credits', 'https://images.unsplash.com/photo-1542751371-adc38448a05e'),
(gen_random_uuid(), 'Free Fire World Cup', 'Free Fire', 'single_elim', 'live', 150, 32, NOW() + INTERVAL '3 days', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days', '# Free Fire Tournament\n\n## Rules\n- Clash Squad Mode\n- Best of 3 rounds\n- No hackers allowed', 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba'),
(gen_random_uuid(), 'Call of Duty Mobile Battle', 'COD Mobile', 'double_elim', 'upcoming', 200, 48, NOW() + INTERVAL '10 days', NOW() + INTERVAL '1 day', NOW() + INTERVAL '8 days', '# COD Mobile Rules\n\n## Match Format\n- Multiplayer 5v5\n- Search & Destroy\n- 3 maps rotation', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f');

-- Insert tournament prizes
INSERT INTO tournament_prizes (tournament_id, rank, amount_zcred, note) 
SELECT id, 1, 5000, '1st Place Winner' FROM tournaments WHERE title = 'PUBG Mobile Championship 2024'
UNION ALL
SELECT id, 2, 3000, '2nd Place' FROM tournaments WHERE title = 'PUBG Mobile Championship 2024'
UNION ALL
SELECT id, 3, 2000, '3rd Place' FROM tournaments WHERE title = 'PUBG Mobile Championship 2024';

-- Insert dummy products
INSERT INTO products (id, name, description, price_credits, stock, image_url, active) VALUES
(gen_random_uuid(), 'InvaderZ Pro Jersey', 'Official InvaderZ esports jersey with moisture-wicking fabric and professional team branding. Premium quality gaming apparel for serious players.', 500, 47, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', true),
(gen_random_uuid(), 'Gaming Headset RGB', 'Professional 7.1 surround sound gaming headset with RGB lighting. Crystal clear microphone and comfortable padding for long gaming sessions.', 800, 25, 'https://images.unsplash.com/photo-1599669454699-248893623440', true),
(gen_random_uuid(), 'Mechanical Gaming Keyboard', 'RGB mechanical keyboard with blue switches. Anti-ghosting technology and customizable backlighting for competitive gaming.', 1200, 15, 'https://images.unsplash.com/photo-1541140532154-b024d705b90a', true),
(gen_random_uuid(), 'Gaming Mouse Pad XXL', 'Extra large gaming mouse pad with smooth surface and non-slip rubber base. Perfect for low-sensitivity gaming setups.', 300, 50, 'https://images.unsplash.com/photo-1527814050087-3793815479db', true),
(gen_random_uuid(), 'InvaderZ Championship Trophy', 'Limited edition championship trophy replica. Perfect for displaying your esports achievements and team pride.', 2000, 5, 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad', true);

-- Insert dummy news posts
INSERT INTO posts (title, slug, type, status, category, content_md, published_at, cover_url) VALUES
('PUBG Mobile World Championship Results', 'pubg-mobile-world-championship-results', 'news', 'published', 'Esports', '# Championship Highlights\n\nAn amazing tournament with incredible plays and upsets. Team Alpha took the crown with a decisive victory in the final match.\n\n## Final Standings\n1. Team Alpha - 5000 Z-Credits\n2. Squad Beta - 3000 Z-Credits\n3. Gaming Legends - 2000 Z-Credits', NOW() - INTERVAL '1 day', 'https://images.unsplash.com/photo-1542751371-adc38448a05e'),
('New Gaming Gear Arrival', 'new-gaming-gear-arrival', 'news', 'published', 'Shop', '# Latest Gaming Equipment\n\nWe just restocked our shop with the latest gaming peripherals including mechanical keyboards, professional headsets, and premium jerseys.', NOW() - INTERVAL '3 days', 'https://images.unsplash.com/photo-1599669454699-248893623440'),
('Free Fire Tournament Announcement', 'free-fire-tournament-announcement', 'news', 'published', 'Tournament', '# Upcoming Free Fire Championship\n\nRegistration is now open for our biggest Free Fire tournament yet. Prize pool of 10,000 Z-Credits up for grabs!', NOW() - INTERVAL '5 days', 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba');

-- Insert dummy guides
INSERT INTO posts (title, slug, type, status, category, content_md, published_at, cover_url) VALUES
('Complete PUBG Mobile Strategy Guide', 'complete-pubg-mobile-strategy-guide', 'guide', 'published', 'Strategy', '# PUBG Mobile Pro Tips\n\n## Landing Strategy\n- Choose hot drops for action\n- Secure early weapons\n- Watch the circle\n\n## Mid Game\n- Rotate early\n- Control high ground\n- Manage inventory\n\n## End Game\n- Position is key\n- Save utilities\n- Stay calm under pressure', NOW() - INTERVAL '2 days', 'https://images.unsplash.com/photo-1542751371-adc38448a05e'),
('Free Fire Aim Training Guide', 'free-fire-aim-training-guide', 'guide', 'published', 'Training', '# Improve Your Free Fire Aim\n\n## Sensitivity Settings\n- Find your perfect sensitivity\n- Practice daily\n- Use training grounds\n\n## Crosshair Placement\n- Keep crosshair at head level\n- Pre-aim common angles\n- Practice flick shots', NOW() - INTERVAL '4 days', 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba'),
('Tournament Registration Guide', 'tournament-registration-guide', 'guide', 'published', 'Tutorial', '# How to Register\n\n## Step 1: Create Account\n- Sign up on our platform\n- Verify your email\n- Complete profile\n\n## Step 2: Add Z-Credits\n- Minimum 200 Z-Credits\n- Upload bank transfer proof\n- Wait for approval\n\n## Step 3: Register for Tournament\n- Choose your tournament\n- Pay entry fee\n- Form your team', NOW() - INTERVAL '6 days', 'https://images.unsplash.com/photo-1556075798-4825dfaaf498');