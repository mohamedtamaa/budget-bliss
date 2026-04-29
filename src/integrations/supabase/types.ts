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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          balance: number
          created_at: string
          credit_limit: number | null
          due_amount: number | null
          due_date: string | null
          exclude_from_total: boolean
          group_id: string | null
          id: string
          name: string
          notes: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          used_amount: number | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          credit_limit?: number | null
          due_amount?: number | null
          due_date?: string | null
          exclude_from_total?: boolean
          group_id?: string | null
          id?: string
          name: string
          notes?: string | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          used_amount?: number | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          credit_limit?: number | null
          due_amount?: number | null
          due_date?: string | null
          exclude_from_total?: boolean
          group_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          used_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "account_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          amount: number
          budget_id: string
          created_at: string
          finished: boolean
          id: string
          name: string
          paid: boolean
          paid_date: string | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["budget_source"]
          type: Database["public"]["Enums"]["budget_item_type"]
          user_id: string
        }
        Insert: {
          amount: number
          budget_id: string
          created_at?: string
          finished?: boolean
          id?: string
          name: string
          paid?: boolean
          paid_date?: string | null
          source_id?: string | null
          source_type: Database["public"]["Enums"]["budget_source"]
          type: Database["public"]["Enums"]["budget_item_type"]
          user_id: string
        }
        Update: {
          amount?: number
          budget_id?: string
          created_at?: string
          finished?: boolean
          id?: string
          name?: string
          paid?: boolean
          paid_date?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["budget_source"]
          type?: Database["public"]["Enums"]["budget_item_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "monthly_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_sections: {
        Row: {
          created_at: string
          formula: Json
          id: string
          name: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          formula?: Json
          id?: string
          name: string
          position?: number
          user_id: string
        }
        Update: {
          created_at?: string
          formula?: Json
          id?: string
          name?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          account_id: string | null
          active: boolean
          created_at: string
          due_day: number
          end_date: string | null
          id: string
          lender: string | null
          monthly_amount: number
          name: string
          notes: string | null
          remaining_balance: number | null
          remaining_payments: number | null
          reminder_days: number[]
          start_date: string
          total_payments: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          active?: boolean
          created_at?: string
          due_day?: number
          end_date?: string | null
          id?: string
          lender?: string | null
          monthly_amount: number
          name: string
          notes?: string | null
          remaining_balance?: number | null
          remaining_payments?: number | null
          reminder_days?: number[]
          start_date?: string
          total_payments?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          active?: boolean
          created_at?: string
          due_day?: number
          end_date?: string | null
          id?: string
          lender?: string | null
          monthly_amount?: number
          name?: string
          notes?: string | null
          remaining_balance?: number | null
          remaining_payments?: number | null
          reminder_days?: number[]
          start_date?: string
          total_payments?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_budgets: {
        Row: {
          created_at: string
          id: string
          month: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          month: string
          paid: boolean
          paid_date: string | null
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          month: string
          paid?: boolean
          paid_date?: string | null
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month?: string
          paid?: boolean
          paid_date?: string | null
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          currency: string
          display_name: string | null
          id: string
          seeded: boolean
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          display_name?: string | null
          id?: string
          seeded?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          display_name?: string | null
          id?: string
          seeded?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_items: {
        Row: {
          account_id: string | null
          active: boolean
          amount: number
          category_id: string | null
          created_at: string
          end_date: string | null
          id: string
          included_in_total: boolean
          name: string
          notes: string | null
          start_date: string
          type: Database["public"]["Enums"]["recurring_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          active?: boolean
          amount: number
          category_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          included_in_total?: boolean
          name: string
          notes?: string | null
          start_date?: string
          type: Database["public"]["Enums"]["recurring_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          active?: boolean
          amount?: number
          category_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          included_in_total?: boolean
          name?: string
          notes?: string | null
          start_date?: string
          type?: Database["public"]["Enums"]["recurring_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          included_in_total: boolean
          is_essential: boolean
          notes: string | null
          type: Database["public"]["Enums"]["txn_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          included_in_total?: boolean
          is_essential?: boolean
          notes?: string | null
          type: Database["public"]["Enums"]["txn_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          included_in_total?: boolean
          is_essential?: boolean
          notes?: string | null
          type?: Database["public"]["Enums"]["txn_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_user_data: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      account_type: "cash" | "wallet" | "bank" | "tracking" | "credit_card"
      budget_item_type: "income" | "expense" | "loan" | "subscription"
      budget_source: "recurring" | "loan" | "card" | "manual"
      recurring_type: "income" | "expense" | "subscription"
      txn_type:
        | "income"
        | "expense"
        | "loan_payment"
        | "card_payment"
        | "transfer"
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
      account_type: ["cash", "wallet", "bank", "tracking", "credit_card"],
      budget_item_type: ["income", "expense", "loan", "subscription"],
      budget_source: ["recurring", "loan", "card", "manual"],
      recurring_type: ["income", "expense", "subscription"],
      txn_type: [
        "income",
        "expense",
        "loan_payment",
        "card_payment",
        "transfer",
      ],
    },
  },
} as const
