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
  public: {
    Tables: {
      favorite_configs: {
        Row: {
          a_parameter: number
          b_parameter: number
          convergence_threshold: number
          created_at: string
          id: string
          max_iterations: number
          name: string
          use_efmnb: boolean
          use_erikson: boolean
          use_proposer_critic_verifier: boolean
          user_id: string
        }
        Insert: {
          a_parameter: number
          b_parameter: number
          convergence_threshold: number
          created_at?: string
          id?: string
          max_iterations: number
          name: string
          use_efmnb?: boolean
          use_erikson?: boolean
          use_proposer_critic_verifier?: boolean
          user_id: string
        }
        Update: {
          a_parameter?: number
          b_parameter?: number
          convergence_threshold?: number
          created_at?: string
          id?: string
          max_iterations?: number
          name?: string
          use_efmnb?: boolean
          use_erikson?: boolean
          use_proposer_critic_verifier?: boolean
          user_id?: string
        }
        Relationships: []
      }
      optimization_results: {
        Row: {
          a_parameter: number | null
          ab_test_notes: string | null
          ab_test_winner: string | null
          accepted: boolean | null
          accepted_iter: number | null
          b_parameter: number | null
          compression_percentage: number | null
          convergence_threshold: number | null
          cost_cents: number | null
          cost_variance_cents: number | null
          created_at: string
          erikson_stage: number | null
          id: string
          improvement_percentage: number | null
          iterations: number | null
          new_quality_score: number | null
          old_quality_score: number | null
          optimized_prompt: string
          optimized_tokens: number | null
          original_prompt: string
          original_tokens: number | null
          quality_gain_percentage: number | null
          quality_improvement_score: number | null
          tokens_breakdown: Json | null
          tta_sec: number | null
          user_id: string
        }
        Insert: {
          a_parameter?: number | null
          ab_test_notes?: string | null
          ab_test_winner?: string | null
          accepted?: boolean | null
          accepted_iter?: number | null
          b_parameter?: number | null
          compression_percentage?: number | null
          convergence_threshold?: number | null
          cost_cents?: number | null
          cost_variance_cents?: number | null
          created_at?: string
          erikson_stage?: number | null
          id?: string
          improvement_percentage?: number | null
          iterations?: number | null
          new_quality_score?: number | null
          old_quality_score?: number | null
          optimized_prompt: string
          optimized_tokens?: number | null
          original_prompt: string
          original_tokens?: number | null
          quality_gain_percentage?: number | null
          quality_improvement_score?: number | null
          tokens_breakdown?: Json | null
          tta_sec?: number | null
          user_id: string
        }
        Update: {
          a_parameter?: number | null
          ab_test_notes?: string | null
          ab_test_winner?: string | null
          accepted?: boolean | null
          accepted_iter?: number | null
          b_parameter?: number | null
          compression_percentage?: number | null
          convergence_threshold?: number | null
          cost_cents?: number | null
          cost_variance_cents?: number | null
          created_at?: string
          erikson_stage?: number | null
          id?: string
          improvement_percentage?: number | null
          iterations?: number | null
          new_quality_score?: number | null
          old_quality_score?: number | null
          optimized_prompt?: string
          optimized_tokens?: number | null
          original_prompt?: string
          original_tokens?: number | null
          quality_gain_percentage?: number | null
          quality_improvement_score?: number | null
          tokens_breakdown?: Json | null
          tta_sec?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_results: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_public: boolean
          optimization_result_id: string
          share_token: string
          title: string | null
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_public?: boolean
          optimization_result_id: string
          share_token: string
          title?: string | null
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_public?: boolean
          optimization_result_id?: string
          share_token?: string
          title?: string | null
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_optimization_result"
            columns: ["optimization_result_id"]
            isOneToOne: false
            referencedRelation: "optimization_results"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      shared_results_public: {
        Row: {
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string | null
          is_public: boolean | null
          optimization_result_id: string | null
          share_token: string | null
          title: string | null
          view_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_public_share: {
        Args: { share_token_param: string }
        Returns: {
          created_at: string
          description: string
          expires_at: string
          id: string
          is_public: boolean
          optimization_result_id: string
          share_token: string
          title: string
          view_count: number
        }[]
      }
      get_shared_results_public: {
        Args: never
        Returns: {
          created_at: string
          description: string
          expires_at: string
          id: string
          is_public: boolean
          optimization_result_id: string
          share_token: string
          title: string
          view_count: number
        }[]
      }
      increment_share_view_count: {
        Args: { share_token_param: string }
        Returns: undefined
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
  public: {
    Enums: {},
  },
} as const
