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
      audit_log: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          metric_name: string | null
          metric_unit: string | null
          new_value: Json | null
          old_value: Json | null
          record_id: string
          table_name: string
          user_display_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          metric_name?: string | null
          metric_unit?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id: string
          table_name: string
          user_display_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          metric_name?: string | null
          metric_unit?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string
          table_name?: string
          user_display_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      daily_analyses: {
        Row: {
          analysis_date: string
          content: string
          created_at: string
          generated_by: string | null
          id: string
          overall: number | null
          period_label: string
          tab_key: string
          updated_at: string
        }
        Insert: {
          analysis_date?: string
          content: string
          created_at?: string
          generated_by?: string | null
          id?: string
          overall?: number | null
          period_label: string
          tab_key: string
          updated_at?: string
        }
        Update: {
          analysis_date?: string
          content?: string
          created_at?: string
          generated_by?: string | null
          id?: string
          overall?: number | null
          period_label?: string
          tab_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_sheet_sources: {
        Row: {
          created_at: string
          csv_url: string
          forecast_locked_at: string | null
          forecast_locked_value: number | null
          id: string
          last_synced_at: string | null
          month: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          csv_url: string
          forecast_locked_at?: string | null
          forecast_locked_value?: number | null
          id?: string
          last_synced_at?: string | null
          month: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          csv_url?: string
          forecast_locked_at?: string | null
          forecast_locked_value?: number | null
          id?: string
          last_synced_at?: string | null
          month?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      metric_history: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          metric_id: string
          period_type: string
          recorded_at: string
          source: string | null
          value: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          metric_id: string
          period_type?: string
          recorded_at?: string
          source?: string | null
          value: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          metric_id?: string
          period_type?: string
          recorded_at?: string
          source?: string | null
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
      metric_subcategories: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      metric_subcategory_assignments: {
        Row: {
          created_at: string
          id: string
          metric_id: string
          sort_order: number
          subcategory_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_id: string
          sort_order?: number
          subcategory_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_id?: string
          sort_order?: number
          subcategory_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metric_subcategory_assignments_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: true
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_subcategory_assignments_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "metric_subcategories"
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
          polarity: string
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
          polarity?: string
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
          polarity?: string
          target_value?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      month_snapshots: {
        Row: {
          auto_closed: boolean
          closed_at: string
          closed_by: string | null
          created_at: string
          id: string
          month: number
          payload: Json
          source: string
          updated_at: string
          year: number
        }
        Insert: {
          auto_closed?: boolean
          closed_at?: string
          closed_by?: string | null
          created_at?: string
          id?: string
          month: number
          payload: Json
          source: string
          updated_at?: string
          year: number
        }
        Update: {
          auto_closed?: boolean
          closed_at?: string
          closed_by?: string | null
          created_at?: string
          id?: string
          month?: number
          payload?: Json
          source?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      monthly_targets: {
        Row: {
          created_at: string
          id: string
          metric_id: string
          month: number
          target_value: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric_id: string
          month: number
          target_value: number
          updated_at?: string
          year?: number
        }
        Update: {
          created_at?: string
          id?: string
          metric_id?: string
          month?: number
          target_value?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_targets_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          job_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ritual_completions: {
        Row: {
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          metric_id: string
          month: number
          occurrence: number
          ritual_key: string
          updated_at: string
          year: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          metric_id: string
          month: number
          occurrence?: number
          ritual_key: string
          updated_at?: string
          year?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          metric_id?: string
          month?: number
          occurrence?: number
          ritual_key?: string
          updated_at?: string
          year?: number
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
      user_tab_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission_type: string
          tab_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_type?: string
          tab_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_type?: string
          tab_key?: string
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
      user_can_delete_metric: {
        Args: { _metric_id: string; _user_id: string }
        Returns: boolean
      }
      user_can_edit_metric: {
        Args: { _metric_id: string; _user_id: string }
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
