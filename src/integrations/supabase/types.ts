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
      bookings: {
        Row: {
          booking_duration_minutes: number | null
          commission_amount: number
          created_at: string
          customer_confirmed: boolean
          customer_id: string
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          provider_earning: number
          provider_id: string | null
          scheduled_at: string
          service_address: string | null
          service_city: string | null
          service_id: string
          service_zip: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          transaction_id: string | null
          payway_transaction_id: string | null
          payway_receipt_number: string | null
          payway_response_code: string | null
          updated_at: string
        }
        Insert: {
          booking_duration_minutes?: number | null
          commission_amount?: number
          created_at?: string
          customer_confirmed?: boolean
          customer_id: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          provider_earning?: number
          provider_id?: string | null
          scheduled_at: string
          service_address?: string | null
          service_city?: string | null
          service_id: string
          service_zip?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          transaction_id?: string | null
          payway_transaction_id?: string | null
          payway_receipt_number?: string | null
          payway_response_code?: string | null
          updated_at?: string
        }
        Update: {
          booking_duration_minutes?: number | null
          commission_amount?: number
          created_at?: string
          customer_confirmed?: boolean
          customer_id?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          provider_earning?: number
          provider_id?: string | null
          scheduled_at?: string
          service_address?: string | null
          service_city?: string | null
          service_id?: string
          service_zip?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
          transaction_id?: string | null
          payway_transaction_id?: string | null
          payway_receipt_number?: string | null
          payway_response_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          raised_by: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          raised_by: string
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          raised_by?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          id: string
          booking_id: string | null
          payway_transaction_id: string | null
          transaction_type: string
          amount: number
          status: string
          response_code: string | null
          response_message: string | null
          raw_response: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id?: string | null
          payway_transaction_id?: string | null
          transaction_type: string
          amount: number
          status?: string
          response_code?: string | null
          response_message?: string | null
          raw_response?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string | null
          payway_transaction_id?: string | null
          transaction_type?: string
          amount?: number
          status?: string
          response_code?: string | null
          response_message?: string | null
          raw_response?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      platform_settings: {
        Row: {
          commission_rate: number
          currency: string
          currency_symbol: string
          id: number
          payway_merchant_id: string | null
          payway_test_mode: boolean
          site_name: string
          payment_mode: string
        }
        Insert: {
          commission_rate?: number
          currency?: string
          currency_symbol?: string
          id?: number
          payway_merchant_id?: string | null
          payway_test_mode?: boolean
          site_name?: string
          payment_mode?: string
        }
        Update: {
          commission_rate?: number
          currency?: string
          currency_symbol?: string
          id?: number
          payway_merchant_id?: string | null
          payway_test_mode?: boolean
          site_name?: string
          payment_mode?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      provider_schedules: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          is_off_day: boolean
          provider_id: string
          start_time: string
        }
        Insert: {
          day_of_week: number
          end_time?: string
          id?: string
          is_off_day?: boolean
          provider_id: string
          start_time?: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          is_off_day?: boolean
          provider_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_schedules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          bio: string | null
          business_name: string
          city: string | null
          commission_rate: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          rating: number | null
          status: Database["public"]["Enums"]["provider_status"]
          total_jobs: number | null
          updated_at: string
          user_id: string
          verification_doc_url: string | null
          wallet_balance: number
          zip_code: string | null
        }
        Insert: {
          bio?: string | null
          business_name: string
          city?: string | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          status?: Database["public"]["Enums"]["provider_status"]
          total_jobs?: number | null
          updated_at?: string
          user_id: string
          verification_doc_url?: string | null
          wallet_balance?: number
          zip_code?: string | null
        }
        Update: {
          bio?: string | null
          business_name?: string
          city?: string | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          status?: Database["public"]["Enums"]["provider_status"]
          total_jobs?: number | null
          updated_at?: string
          user_id?: string
          verification_doc_url?: string | null
          wallet_balance?: number
          zip_code?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          rating: number
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          booking_id: string | null
          created_at: string
          description: string | null
          id: string
          provider_id: string
          type: Database["public"]["Enums"]["txn_type"]
        }
        Insert: {
          amount: number
          balance_after: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          provider_id: string
          type: Database["public"]["Enums"]["txn_type"]
        }
        Update: {
          amount?: number
          balance_after?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          provider_id?: string
          type?: Database["public"]["Enums"]["txn_type"]
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          account_details: string | null
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          method: string | null
          processed_at: string | null
          provider_id: string
          status: Database["public"]["Enums"]["withdrawal_status"]
        }
        Insert: {
          account_details?: string | null
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          method?: string | null
          processed_at?: string | null
          provider_id: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Update: {
          account_details?: string | null
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          method?: string | null
          processed_at?: string | null
          provider_id?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "provider" | "customer"
      booking_status:
      | "pending"
      | "accepted"
      | "in_progress"
      | "completed"
      | "cancelled"
      | "disputed"
      dispute_status: "open" | "resolved" | "refunded"
      payment_status: "unpaid" | "escrow" | "released" | "refunded"
      provider_status: "pending" | "approved" | "suspended" | "rejected"
      txn_type: "credit" | "debit" | "commission" | "withdrawal" | "refund"
      withdrawal_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "provider", "customer"],
      booking_status: [
        "pending",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      dispute_status: ["open", "resolved", "refunded"],
      payment_status: ["unpaid", "escrow", "released", "refunded"],
      provider_status: ["pending", "approved", "suspended", "rejected"],
      txn_type: ["credit", "debit", "commission", "withdrawal", "refund"],
      withdrawal_status: ["pending", "approved", "rejected"],
    },
  },
} as const
