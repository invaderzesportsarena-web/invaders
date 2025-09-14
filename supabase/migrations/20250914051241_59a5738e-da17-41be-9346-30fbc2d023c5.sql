-- Update conversion rate to 1 PKR = 1 Z-Credit
INSERT INTO conversion_rate (rate, effective_date) VALUES (1, NOW());

-- Update minimum deposit amounts - 200 Z-Credits minimum
UPDATE admin_account_details SET instructions = 'Minimum deposit: 200 Z-Credits (PKR 200). Bank transfers only. Upload clear screenshot for verification.';

-- Create a guide detail page route by adding a sample guide post
INSERT INTO posts (title, slug, type, status, category, content_md, published_at, cover_url)
VALUES (
  'How to Register for InvaderZ Tournaments',
  'how-to-register-for-invaderz-tournaments',
  'guide',
  'published',
  'Tournament',
  '# How to Register for InvaderZ Tournaments

## Step 1: Create Your Account
- Visit the InvaderZ website
- Click on "Sign Up" and create your account
- Verify your email address

## Step 2: Complete Your Profile
- Add your in-game name
- Enter your WhatsApp number
- Upload a profile picture (optional)

## Step 3: Add Z-Credits to Your Wallet
- Navigate to the Wallet section
- Choose "Deposit"
- Minimum deposit is 200 Z-Credits (PKR 200)
- Upload a clear screenshot of your bank transfer

## Step 4: Find and Register for Tournaments
- Browse available tournaments in the Tournaments section
- Check entry fees and prize pools
- Click "Register" and enter your team details
- Confirm your registration

## Important Notes
- Registration closes 2 hours before tournament start
- Entry fees are non-refundable once tournaments begin
- Make sure you have sufficient Z-Credits before registering

Good luck and may the best team win!',
  NOW(),
  NULL
);