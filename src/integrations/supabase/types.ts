export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      order_items: {
        Row: {
          id: string
          order_id: string
          price_credits: number
          product_id: string
          qty: number
        }
        Insert: {
          id?: string
          order_id: string
          price_credits: number
          product_id: string
          qty: number
        }
        Update: {
          id?: string
          order_id?: string
          price_credits?: number
          product_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          status: string
          total_credits: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          total_credits: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          total_credits?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          category: string | null
          content_md: string | null
          cover_url: string | null
          created_at: string
          id: string
          published_at: string | null
          slug: string
          status: string
          title: string
          type: Database["public"]["Enums"]["post_type"]
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content_md?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          type: Database["public"]["Enums"]["post_type"]
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content_md?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          type?: Database["public"]["Enums"]["post_type"]
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price_credits: number
          stock: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_credits: number
          stock?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_credits?: number
          stock?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["role_enum"]
          username: string | null
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["role_enum"]
          username?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["role_enum"]
          username?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          captain_id: string
          contact_phone: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["reg_status"]
          team_name: string
          tournament_id: string
          whatsapp_number: string | null
        }
        Insert: {
          captain_id: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["reg_status"]
          team_name: string
          tournament_id: string
          whatsapp_number?: string | null
        }
        Update: {
          captain_id?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["reg_status"]
          team_name?: string
          tournament_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      results_media: {
        Row: {
          created_at: string
          id: string
          image_url: string
          thumb_url: string | null
          title: string | null
          tournament_id: string
          uploaded_by: string | null
          visible: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          thumb_url?: string | null
          title?: string | null
          tournament_id: string
          uploaded_by?: string | null
          visible?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          thumb_url?: string | null
          title?: string | null
          tournament_id?: string
          uploaded_by?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "results_media_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_players: {
        Row: {
          created_at: string
          game_uid: string | null
          id: string
          note: string | null
          player_name: string
          team_id: string
        }
        Insert: {
          created_at?: string
          game_uid?: string | null
          id?: string
          note?: string | null
          player_name: string
          team_id: string
        }
        Update: {
          created_at?: string
          game_uid?: string | null
          id?: string
          note?: string | null
          player_name?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          about: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          tag: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          tag?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          entry_fee_credits: number
          format: Database["public"]["Enums"]["t_format"]
          game: string | null
          id: string
          reg_closes_at: string | null
          rules_md: string | null
          starts_at: string | null
          state: Database["public"]["Enums"]["t_state"]
          title: string
        }
        Insert: {
          created_at?: string
          entry_fee_credits?: number
          format?: Database["public"]["Enums"]["t_format"]
          game?: string | null
          id?: string
          reg_closes_at?: string | null
          rules_md?: string | null
          starts_at?: string | null
          state?: Database["public"]["Enums"]["t_state"]
          title: string
        }
        Update: {
          created_at?: string
          entry_fee_credits?: number
          format?: Database["public"]["Enums"]["t_format"]
          game?: string | null
          id?: string
          reg_closes_at?: string | null
          rules_md?: string | null
          starts_at?: string | null
          state?: Database["public"]["Enums"]["t_state"]
          title?: string
        }
        Relationships: []
      }
      whatsapp_invites: {
        Row: {
          active: boolean
          created_at: string
          id: string
          invite_link: string
          notes: string | null
          tournament_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          invite_link: string
          notes?: string | null
          tournament_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          invite_link?: string
          notes?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_invites_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      zcred_deposit_forms: {
        Row: {
          amount_money: number
          bank_sender_name: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          screenshot_url: string | null
          sender_account_no: string
          sender_bank: string
          status: Database["public"]["Enums"]["deposit_status"]
          transfer_timestamp: string | null
          user_id: string
        }
        Insert: {
          amount_money: number
          bank_sender_name: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          screenshot_url?: string | null
          sender_account_no: string
          sender_bank: string
          status?: Database["public"]["Enums"]["deposit_status"]
          transfer_timestamp?: string | null
          user_id: string
        }
        Update: {
          amount_money?: number
          bank_sender_name?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          screenshot_url?: string | null
          sender_account_no?: string
          sender_bank?: string
          status?: Database["public"]["Enums"]["deposit_status"]
          transfer_timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zcred_deposit_forms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zcred_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          ref: Json | null
          status: Database["public"]["Enums"]["zt_status"]
          type: Database["public"]["Enums"]["zt_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          ref?: Json | null
          status?: Database["public"]["Enums"]["zt_status"]
          type: Database["public"]["Enums"]["zt_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          ref?: Json | null
          status?: Database["public"]["Enums"]["zt_status"]
          type?: Database["public"]["Enums"]["zt_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zcred_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zcred_withdrawal_forms: {
        Row: {
          amount_zcreds: number
          created_at: string
          iban_optional: string | null
          id: string
          notes: string | null
          recipient_account_no: string
          recipient_bank: string
          recipient_name: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Insert: {
          amount_zcreds: number
          created_at?: string
          iban_optional?: string | null
          id?: string
          notes?: string | null
          recipient_account_no: string
          recipient_bank: string
          recipient_name: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Update: {
          amount_zcreds?: number
          created_at?: string
          iban_optional?: string | null
          id?: string
          notes?: string | null
          recipient_account_no?: string
          recipient_bank?: string
          recipient_name?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zcred_withdrawal_forms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      zcred_balances: {
        Row: {
          balance: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zcred_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: {
        Args: { uid: string }
        Returns: boolean
      }
      make_user_admin: {
        Args: { target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      deposit_status: "submitted" | "verified" | "rejected"
      post_type: "news" | "guide"
      reg_status: "pending" | "approved" | "rejected" | "withdrawn"
      role_enum: "player" | "moderator" | "admin"
      t_format: "single_elim" | "round_robin"
      t_state:
        | "draft"
        | "registration_open"
        | "locked"
        | "in_progress"
        | "completed"
      withdrawal_status: "submitted" | "paid" | "rejected"
      zt_status: "pending" | "approved" | "rejected"
      zt_type:
        | "deposit_request"
        | "deposit_credit"
        | "withdrawal_request"
        | "withdrawal_payout"
        | "adjust"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      deposit_status: ["submitted", "verified", "rejected"],
      post_type: ["news", "guide"],
      reg_status: ["pending", "approved", "rejected", "withdrawn"],
      role_enum: ["player", "moderator", "admin"],
      t_format: ["single_elim", "round_robin"],
      t_state: [
        "draft",
        "registration_open",
        "locked",
        "in_progress",
        "completed",
      ],
      withdrawal_status: ["submitted", "paid", "rejected"],
      zt_status: ["pending", "approved", "rejected"],
      zt_type: [
        "deposit_request",
        "deposit_credit",
        "withdrawal_request",
        "withdrawal_payout",
        "adjust",
      ],
    },
  },
} as const
