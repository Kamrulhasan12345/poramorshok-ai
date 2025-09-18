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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          message_text: string
          sender: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_text: string
          sender: string
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_text?: string
          sender?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          session_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          session_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plan_days: {
        Row: {
          daily_note: string | null
          day_name: string
          day_order: number
          diet_plan_id: string
          id: string
        }
        Insert: {
          daily_note?: string | null
          day_name: string
          day_order: number
          diet_plan_id: string
          id?: string
        }
        Update: {
          daily_note?: string | null
          day_name?: string
          day_order?: number
          diet_plan_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_plan_days_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plan_meals: {
        Row: {
          diet_plan_day_id: string
          id: string
          meal_items: Json
          meal_name: string
          meal_order: number
        }
        Insert: {
          diet_plan_day_id: string
          id?: string
          meal_items: Json
          meal_name: string
          meal_order: number
        }
        Update: {
          diet_plan_day_id?: string
          id?: string
          meal_items?: Json
          meal_name?: string
          meal_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "diet_plan_meals_diet_plan_day_id_fkey"
            columns: ["diet_plan_day_id"]
            isOneToOne: false
            referencedRelation: "diet_plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plans: {
        Row: {
          based_on_health_entry_id: string | null
          created_at: string | null
          dietary_preference: string
          goal: string
          id: string
          summary: string
          user_id: string
        }
        Insert: {
          based_on_health_entry_id?: string | null
          created_at?: string | null
          dietary_preference: string
          goal: string
          id?: string
          summary: string
          user_id: string
        }
        Update: {
          based_on_health_entry_id?: string | null
          created_at?: string | null
          dietary_preference?: string
          goal?: string
          id?: string
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_plans_based_on_health_entry_id_fkey"
            columns: ["based_on_health_entry_id"]
            isOneToOne: false
            referencedRelation: "health_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_reminder_times: {
        Row: {
          drug_id: string
          id: string
          is_active: boolean | null
          reminder_time: string
        }
        Insert: {
          drug_id: string
          id?: string
          is_active?: boolean | null
          reminder_time: string
        }
        Update: {
          drug_id?: string
          id?: string
          is_active?: boolean | null
          reminder_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "drug_reminder_times_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "prescription_drugs"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_plan_days: {
        Row: {
          day_name: string
          day_order: number
          details: string | null
          exercise_plan_id: string
          id: string
        }
        Insert: {
          day_name: string
          day_order: number
          details?: string | null
          exercise_plan_id: string
          id?: string
        }
        Update: {
          day_name?: string
          day_order?: number
          details?: string | null
          exercise_plan_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_plan_days_exercise_plan_id_fkey"
            columns: ["exercise_plan_id"]
            isOneToOne: false
            referencedRelation: "exercise_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_plan_exercises: {
        Row: {
          description: string
          duration: string
          exercise_name: string
          exercise_order: number
          exercise_plan_day_id: string
          exercise_type: string
          id: string
        }
        Insert: {
          description: string
          duration: string
          exercise_name: string
          exercise_order: number
          exercise_plan_day_id: string
          exercise_type: string
          id?: string
        }
        Update: {
          description?: string
          duration?: string
          exercise_name?: string
          exercise_order?: number
          exercise_plan_day_id?: string
          exercise_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_plan_exercises_exercise_plan_day_id_fkey"
            columns: ["exercise_plan_day_id"]
            isOneToOne: false
            referencedRelation: "exercise_plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_plans: {
        Row: {
          advice: string
          based_on_health_entry_id: string | null
          created_at: string | null
          fitness_level: string
          goal: string
          id: string
          location: string
          time_per_day: string
          user_id: string
        }
        Insert: {
          advice: string
          based_on_health_entry_id?: string | null
          created_at?: string | null
          fitness_level: string
          goal: string
          id?: string
          location: string
          time_per_day: string
          user_id: string
        }
        Update: {
          advice?: string
          based_on_health_entry_id?: string | null
          created_at?: string | null
          fitness_level?: string
          goal?: string
          id?: string
          location?: string
          time_per_day?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_plans_based_on_health_entry_id_fkey"
            columns: ["based_on_health_entry_id"]
            isOneToOne: false
            referencedRelation: "health_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      health_advice: {
        Row: {
          based_on_entries_count: number
          created_at: string | null
          dietary_advice: Json
          exercise_recommendations: Json
          id: string
          language: string
          lifestyle_suggestions: Json
          user_id: string
        }
        Insert: {
          based_on_entries_count: number
          created_at?: string | null
          dietary_advice: Json
          exercise_recommendations: Json
          id?: string
          language: string
          lifestyle_suggestions: Json
          user_id: string
        }
        Update: {
          based_on_entries_count?: number
          created_at?: string | null
          dietary_advice?: Json
          exercise_recommendations?: Json
          id?: string
          language?: string
          lifestyle_suggestions?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_advice_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      health_entries: {
        Row: {
          age: number
          bmi: number
          created_at: string | null
          date: string
          height_cm: number
          id: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          age: number
          bmi: number
          created_at?: string | null
          date: string
          height_cm: number
          id?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          age?: number
          bmi?: number
          created_at?: string | null
          date?: string
          height_cm?: number
          id?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "health_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_info: {
        Row: {
          contact_info: string | null
          created_at: string | null
          file_data: string | null
          file_type: string | null
          id: string
          policy_number: string
          provider_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string | null
          file_data?: string | null
          file_type?: string | null
          id?: string
          policy_number: string
          provider_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string | null
          file_data?: string | null
          file_type?: string | null
          id?: string
          policy_number?: string
          provider_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_info_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          created_at: string | null
          file_data: string
          file_size_bytes: number | null
          file_type: string
          id: string
          issue_date: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_data: string
          file_size_bytes?: number | null
          file_type: string
          id?: string
          issue_date: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_data?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          issue_date?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_drugs: {
        Row: {
          created_at: string | null
          dosage: string
          drug_name: string
          id: string
          prescription_id: string
          reminder_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          dosage: string
          drug_name: string
          id?: string
          prescription_id: string
          reminder_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          dosage?: string
          drug_name?: string
          id?: string
          prescription_id?: string
          reminder_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_drugs_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string | null
          doctor_name: string
          file_data: string | null
          file_type: string | null
          id: string
          issue_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          doctor_name: string
          file_data?: string | null
          file_type?: string | null
          id?: string
          issue_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          doctor_name?: string
          file_data?: string | null
          file_type?: string | null
          id?: string
          issue_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      symptom_analyses: {
        Row: {
          causes: Json
          created_at: string | null
          id: string
          medications: Json
          mental_health_support: Json | null
          message_id: string
          symptoms: Json
          treatments: Json
        }
        Insert: {
          causes: Json
          created_at?: string | null
          id?: string
          medications: Json
          mental_health_support?: Json | null
          message_id: string
          symptoms: Json
          treatments: Json
        }
        Update: {
          causes?: Json
          created_at?: string | null
          id?: string
          medications?: Json
          mental_health_support?: Json | null
          message_id?: string
          symptoms?: Json
          treatments?: Json
        }
        Relationships: [
          {
            foreignKeyName: "symptom_analyses_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          language_preference: string | null
          name: string
          theme_preference: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          language_preference?: string | null
          name: string
          theme_preference?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          language_preference?: string | null
          name?: string
          theme_preference?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
