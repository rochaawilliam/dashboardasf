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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      metric_history: {
        Row: {
          created_at: string
          id: string
          metric_id: string
          period_type: string
          recorded_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric_id: string
          period_type?: string
          recorded_at?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric_id?: string
          period_type?: string
          recorded_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metric_history_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          category: Database["public"]["Enums"]["metric_category"]
          created_at: string
          current_value: number
          description: string | null
          division: Database["public"]["Enums"]["division"] | null
          id: string
          name: string
          target_value: number
          unit: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["metric_category"]
          created_at?: string
          current_value?: number
          description?: string | null
          division?: Database["public"]["Enums"]["division"] | null
          id?: string
          name: string
          target_value: number
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["metric_category"]
          created_at?: string
          current_value?: number
          description?: string | null
          division?: Database["public"]["Enums"]["division"] | null
          id?: string
          name?: string
          target_value?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_hours: {
        Row: {
          created_at: string
          current_hours: number
          division: Database["public"]["Enums"]["division"] | null
          id: string
          role: string
          target_hours: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_hours?: number
          division?: Database["public"]["Enums"]["division"] | null
          id?: string
          role: string
          target_hours: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_hours?: number
          division?: Database["public"]["Enums"]["division"] | null
          id?: string
          role?: string
          target_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          language: string
          notifications_enabled: boolean
          notify_on_goal_missed: boolean
          notify_on_goal_reached: boolean
          notify_on_trend_change: boolean
          show_annual_goals: boolean
          show_monthly_goals: boolean
          show_progress_percentage: boolean
          show_sparklines: boolean
          show_trend_indicators: boolean
          theme: string
          trend_period_months: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          notifications_enabled?: boolean
          notify_on_goal_missed?: boolean
          notify_on_goal_reached?: boolean
          notify_on_trend_change?: boolean
          show_annual_goals?: boolean
          show_monthly_goals?: boolean
          show_progress_percentage?: boolean
          show_sparklines?: boolean
          show_trend_indicators?: boolean
          theme?: string
          trend_period_months?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          notifications_enabled?: boolean
          notify_on_goal_missed?: boolean
          notify_on_goal_reached?: boolean
          notify_on_trend_change?: boolean
          show_annual_goals?: boolean
          show_monthly_goals?: boolean
          show_progress_percentage?: boolean
          show_sparklines?: boolean
          show_trend_indicators?: boolean
          theme?: string
          trend_period_months?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      app_role: "admin" | "user"
      division: "juridico" | "crescimento" | "marketing" | "administrativo"
      metric_category:
        | "lucratividade"
        | "experiencia_cliente"
        | "produtividade"
        | "gestao_pessoas"
        | "aprendizado_crescimento"
        | "execucao_comercial"
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
      app_role: ["admin", "user"],
      division: ["juridico", "crescimento", "marketing", "administrativo"],
      metric_category: [
        "lucratividade",
        "experiencia_cliente",
        "produtividade",
        "gestao_pessoas",
        "aprendizado_crescimento",
        "execucao_comercial",
      ],
    },
  },
} as const
