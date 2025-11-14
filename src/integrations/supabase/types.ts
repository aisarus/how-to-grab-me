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
      data_room_documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          path: string
          restricted: boolean | null
          section_id: string
          storage_path: string | null
          type: string
          updated_at: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          path: string
          restricted?: boolean | null
          section_id: string
          storage_path?: string | null
          type: string
          updated_at?: string | null
          version: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          path?: string
          restricted?: boolean | null
          section_id?: string
          storage_path?: string | null
          type?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
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
          compactness_percentage: number | null
          compression_percentage: number | null
          convergence_threshold: number | null
          cost_cents: number | null
          cost_variance_cents: number | null
          created_at: string
          cumulative_explanation: string | null
          delta_q: number | null
          delta_t: number | null
          efficiency_percentage: number | null
          efficiency_score: number | null
          erikson_stage: number | null
          explain_mode_enabled: boolean | null
          id: string
          improvement_percentage: number | null
          iterations: number | null
          judge_votes: Json | null
          lambda_tradeoff: number | null
          new_quality_score: number | null
          old_quality_score: number | null
          optimized_by_default: boolean | null
          optimized_prompt: string
          optimized_tokens: number | null
          original_prompt: string
          original_tokens: number | null
          priority_score: number | null
          quality_gain_percentage: number | null
          reasoning_gain_index: number | null
          smart_queue_enabled: boolean | null
          tokens_breakdown: Json | null
          tta_sec: number | null
          user_id: string
          versioning_enabled: boolean | null
        }
        Insert: {
          a_parameter?: number | null
          ab_test_notes?: string | null
          ab_test_winner?: string | null
          accepted?: boolean | null
          accepted_iter?: number | null
          b_parameter?: number | null
          compactness_percentage?: number | null
          compression_percentage?: number | null
          convergence_threshold?: number | null
          cost_cents?: number | null
          cost_variance_cents?: number | null
          created_at?: string
          cumulative_explanation?: string | null
          delta_q?: number | null
          delta_t?: number | null
          efficiency_percentage?: number | null
          efficiency_score?: number | null
          erikson_stage?: number | null
          explain_mode_enabled?: boolean | null
          id?: string
          improvement_percentage?: number | null
          iterations?: number | null
          judge_votes?: Json | null
          lambda_tradeoff?: number | null
          new_quality_score?: number | null
          old_quality_score?: number | null
          optimized_by_default?: boolean | null
          optimized_prompt: string
          optimized_tokens?: number | null
          original_prompt: string
          original_tokens?: number | null
          priority_score?: number | null
          quality_gain_percentage?: number | null
          reasoning_gain_index?: number | null
          smart_queue_enabled?: boolean | null
          tokens_breakdown?: Json | null
          tta_sec?: number | null
          user_id: string
          versioning_enabled?: boolean | null
        }
        Update: {
          a_parameter?: number | null
          ab_test_notes?: string | null
          ab_test_winner?: string | null
          accepted?: boolean | null
          accepted_iter?: number | null
          b_parameter?: number | null
          compactness_percentage?: number | null
          compression_percentage?: number | null
          convergence_threshold?: number | null
          cost_cents?: number | null
          cost_variance_cents?: number | null
          created_at?: string
          cumulative_explanation?: string | null
          delta_q?: number | null
          delta_t?: number | null
          efficiency_percentage?: number | null
          efficiency_score?: number | null
          erikson_stage?: number | null
          explain_mode_enabled?: boolean | null
          id?: string
          improvement_percentage?: number | null
          iterations?: number | null
          judge_votes?: Json | null
          lambda_tradeoff?: number | null
          new_quality_score?: number | null
          old_quality_score?: number | null
          optimized_by_default?: boolean | null
          optimized_prompt?: string
          optimized_tokens?: number | null
          original_prompt?: string
          original_tokens?: number | null
          priority_score?: number | null
          quality_gain_percentage?: number | null
          reasoning_gain_index?: number | null
          smart_queue_enabled?: boolean | null
          tokens_breakdown?: Json | null
          tta_sec?: number | null
          user_id?: string
          versioning_enabled?: boolean | null
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
      prompt_explanations: {
        Row: {
          created_at: string | null
          expected_effects: string[] | null
          full_explanation: string
          id: string
          iteration_number: number
          key_transformations: string[] | null
          main_issues: string[] | null
          optimization_result_id: string | null
          version_id: string | null
        }
        Insert: {
          created_at?: string | null
          expected_effects?: string[] | null
          full_explanation: string
          id?: string
          iteration_number: number
          key_transformations?: string[] | null
          main_issues?: string[] | null
          optimization_result_id?: string | null
          version_id?: string | null
        }
        Update: {
          created_at?: string | null
          expected_effects?: string[] | null
          full_explanation?: string
          id?: string
          iteration_number?: number
          key_transformations?: string[] | null
          main_issues?: string[] | null
          optimization_result_id?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_explanations_optimization_result_id_fkey"
            columns: ["optimization_result_id"]
            isOneToOne: false
            referencedRelation: "optimization_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_explanations_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          content_hash: string
          created_at: string | null
          id: string
          iteration_number: number
          new_id: string
          optimization_result_id: string | null
          original_id: string
          previous_content_hash: string | null
          prompt_content: string
          reviewer_action: string | null
          timestamp: string | null
        }
        Insert: {
          content_hash: string
          created_at?: string | null
          id?: string
          iteration_number: number
          new_id: string
          optimization_result_id?: string | null
          original_id: string
          previous_content_hash?: string | null
          prompt_content: string
          reviewer_action?: string | null
          timestamp?: string | null
        }
        Update: {
          content_hash?: string
          created_at?: string | null
          id?: string
          iteration_number?: number
          new_id?: string
          optimization_result_id?: string | null
          original_id?: string
          previous_content_hash?: string | null
          prompt_content?: string
          reviewer_action?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_optimization_result_id_fkey"
            columns: ["optimization_result_id"]
            isOneToOne: false
            referencedRelation: "optimization_results"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
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
