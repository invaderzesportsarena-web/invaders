/**
 * Centralized Supabase table and column configuration
 * This ensures consistency across the application and helps prevent schema-related errors
 */

export const SUPABASE_CONFIG = {
  tables: {
    TOURNAMENTS: 'tournaments',
    REGISTRATIONS: 'registrations',
    TOURNAMENT_PRIZES: 'tournament_prizes',
    ZCRED_DEPOSIT_FORMS: 'zcred_deposit_forms',
    ZCRED_WITHDRAWAL_FORMS: 'zcred_withdrawal_forms',
    ZCRED_TRANSACTIONS: 'zcred_transactions',
    ZCRED_WALLETS: 'zcred_wallets',
    PROFILES: 'profiles',
  },
  
  columns: {
    registrations: {
      ID: 'id',
      TOURNAMENT_ID: 'tournament_id',
      CAPTAIN_ID: 'captain_id',
      TEAM_NAME: 'team_name',
      CONTACT_PHONE: 'contact_phone',
      WHATSAPP_NUMBER: 'whatsapp_number',
      STATUS: 'status',
      CREATED_AT: 'created_at',
    },
    
    tournaments: {
      ID: 'id',
      TITLE: 'title',
      GAME: 'game',
      ENTRY_FEE_CREDITS: 'entry_fee_credits',
      STARTS_AT: 'starts_at',
      REG_CLOSES_AT: 'reg_closes_at',
      FORMAT: 'format',
      STATE: 'state',
      SLOTS: 'slots',
      REG_STARTS_AT: 'reg_starts_at',
      RULES_MD: 'rules_md',
      COVER_URL: 'cover_url',
      CREATED_AT: 'created_at',
    },
    
    tournament_prizes: {
      ID: 'id',
      TOURNAMENT_ID: 'tournament_id',
      RANK: 'rank',
      AMOUNT_ZCRED: 'amount_zcred',
      NOTE: 'note',
    },
    
    zcred_deposit_forms: {
      ID: 'id',
      USER_ID: 'user_id',
      AMOUNT_MONEY: 'amount_money',
      CURRENCY: 'currency',
      SENDER_BANK: 'sender_bank',
      SENDER_ACCOUNT_NO: 'sender_account_no',
      BANK_SENDER_NAME: 'bank_sender_name',
      TRANSFER_TIMESTAMP: 'transfer_timestamp',
      SCREENSHOT_URL: 'screenshot_url',
      STATUS: 'status',
      NOTES: 'notes',
      APPROVED_CREDITS: 'approved_credits',
      REVIEWED_BY: 'reviewed_by',
      REVIEWED_AT: 'reviewed_at',
      REJECTION_REASON: 'rejection_reason',
      CREATED_AT: 'created_at',
    },
    
    zcred_withdrawal_forms: {
      ID: 'id',
      USER_ID: 'user_id',
      AMOUNT_ZCREDS: 'amount_zcreds',
      RECIPIENT_NAME: 'recipient_name',
      RECIPIENT_BANK: 'recipient_bank',
      RECIPIENT_ACCOUNT_NO: 'recipient_account_no',
      IBAN_OPTIONAL: 'iban_optional',
      STATUS: 'status',
      NOTES: 'notes',
      APPROVED_CREDITS: 'approved_credits',
      REVIEWED_BY: 'reviewed_by',
      REVIEWED_AT: 'reviewed_at',
      REJECTION_REASON: 'rejection_reason',
      CREATED_AT: 'created_at',
    },
  },
  
  storage: {
    buckets: {
      WALLET_PROOFS: 'proofs', // Use existing proofs bucket
      FALLBACK_BUCKET: 'proofs', // Fallback bucket name
    },
  },
  
  functions: {
    REGISTER_FOR_TOURNAMENT: 'register_for_tournament',
    UPSERT_PRIZE: 'upsert_prize',
  },
} as const;

export const VALIDATION = {
  ZCRED_REGEX: /^\d+(\.\d{1,2})?$/,
  MIN_DEPOSIT_PKR: 180,
  EXCHANGE_RATE: 90, // 1 Z-Credit = 90 PKR
} as const;