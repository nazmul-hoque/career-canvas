export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string;
          admin_id: string | null;
          created_at: string;
          detail: Json;
          id: string;
          target_id: string;
          target_type: string;
        };
        Insert: {
          action: string;
          admin_id?: string | null;
          created_at?: string;
          detail?: Json;
          id?: string;
          target_id: string;
          target_type: string;
        };
        Update: {
          action?: string;
          admin_id?: string | null;
          created_at?: string;
          detail?: Json;
          id?: string;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          granted_at: string;
          note: string | null;
          user_id: string;
        };
        Insert: {
          granted_at?: string;
          note?: string | null;
          user_id: string;
        };
        Update: {
          granted_at?: string;
          note?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          anon_id: string | null;
          created_at: string;
          id: string;
          name: string;
          path: string | null;
          props: Json;
          user_id: string | null;
        };
        Insert: {
          anon_id?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          path?: string | null;
          props?: Json;
          user_id?: string | null;
        };
        Update: {
          anon_id?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          path?: string | null;
          props?: Json;
          user_id?: string | null;
        };
        Relationships: [];
      };
      community_posts: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          likes: number;
          title: string;
          topic: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          likes?: number;
          title: string;
          topic?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          likes?: number;
          title?: string;
          topic?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      community_reports: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          reason: string;
          reporter_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          reason: string;
          reporter_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          reason?: string;
          reporter_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_reports_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_activity: {
        Row: {
          day: string;
          id: string;
          user_id: string;
          xp: number;
        };
        Insert: {
          day?: string;
          id?: string;
          user_id: string;
          xp?: number;
        };
        Update: {
          day?: string;
          id?: string;
          user_id?: string;
          xp?: number;
        };
        Relationships: [];
      };
      issued_certificates: {
        Row: {
          certificate_id: string;
          issued_at: string;
          path_id: string;
          plan_at_issue: string;
          signature: string | null;
          user_id: string;
        };
        Insert: {
          certificate_id: string;
          issued_at?: string;
          path_id: string;
          plan_at_issue: string;
          signature?: string | null;
          user_id: string;
        };
        Update: {
          certificate_id?: string;
          issued_at?: string;
          path_id?: string;
          plan_at_issue?: string;
          signature?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      lesson_progress: {
        Row: {
          completed_at: string;
          course_id: string;
          id: string;
          lesson_id: string;
          status: string;
          user_id: string;
          xp_earned: number;
        };
        Insert: {
          completed_at?: string;
          course_id: string;
          id?: string;
          lesson_id: string;
          status?: string;
          user_id: string;
          xp_earned?: number;
        };
        Update: {
          completed_at?: string;
          course_id?: string;
          id?: string;
          lesson_id?: string;
          status?: string;
          user_id?: string;
          xp_earned?: number;
        };
        Relationships: [];
      };
      lesson_reports: {
        Row: {
          code: string | null;
          context: Json;
          course_id: string;
          created_at: string;
          id: string;
          kind: string;
          lesson_id: string;
          message: string;
          reporter_id: string;
          status: string;
        };
        Insert: {
          code?: string | null;
          context?: Json;
          course_id: string;
          created_at?: string;
          id?: string;
          kind: string;
          lesson_id: string;
          message: string;
          reporter_id: string;
          status?: string;
        };
        Update: {
          code?: string | null;
          context?: Json;
          course_id?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          lesson_id?: string;
          message?: string;
          reporter_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      mentor_messages: {
        Row: {
          content: string;
          course_id: string;
          created_at: string;
          id: string;
          lesson_id: string;
          model: string | null;
          provider: string | null;
          role: string;
          user_id: string;
        };
        Insert: {
          content: string;
          course_id: string;
          created_at?: string;
          id?: string;
          lesson_id: string;
          model?: string | null;
          provider?: string | null;
          role: string;
          user_id: string;
        };
        Update: {
          content?: string;
          course_id?: string;
          created_at?: string;
          id?: string;
          lesson_id?: string;
          model?: string | null;
          provider?: string | null;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          career_path: string | null;
          created_at: string;
          display_name: string;
          email_optin: boolean;
          experience: string | null;
          goal: string | null;
          hours_per_week: number | null;
          id: string;
          last_active_day: string | null;
          level: number;
          onboarded: boolean;
          plan: string;
          streak_best: number;
          streak_current: number;
          trial_ends_at: string | null;
          updated_at: string;
          xp: number;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          career_path?: string | null;
          created_at?: string;
          display_name?: string;
          email_optin?: boolean;
          experience?: string | null;
          goal?: string | null;
          hours_per_week?: number | null;
          id: string;
          last_active_day?: string | null;
          level?: number;
          onboarded?: boolean;
          plan?: string;
          streak_best?: number;
          streak_current?: number;
          trial_ends_at?: string | null;
          updated_at?: string;
          xp?: number;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          career_path?: string | null;
          created_at?: string;
          display_name?: string;
          email_optin?: boolean;
          experience?: string | null;
          goal?: string | null;
          hours_per_week?: number | null;
          id?: string;
          last_active_day?: string | null;
          level?: number;
          onboarded?: boolean;
          plan?: string;
          streak_best?: number;
          streak_current?: number;
          trial_ends_at?: string | null;
          updated_at?: string;
          xp?: number;
        };
        Relationships: [];
      };
      project_milestones: {
        Row: {
          checked_at: string;
          milestone_index: number;
          project_id: string;
          user_id: string;
        };
        Insert: {
          checked_at?: string;
          milestone_index: number;
          project_id: string;
          user_id: string;
        };
        Update: {
          checked_at?: string;
          milestone_index?: number;
          project_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      project_submissions: {
        Row: {
          created_at: string;
          feedback: string | null;
          id: string;
          is_published: boolean;
          live_url: string | null;
          notes: string | null;
          project_id: string;
          public_summary: string;
          repo_url: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          feedback?: string | null;
          id?: string;
          is_published?: boolean;
          live_url?: string | null;
          notes?: string | null;
          project_id: string;
          public_summary?: string;
          repo_url?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          feedback?: string | null;
          id?: string;
          is_published?: boolean;
          live_url?: string | null;
          notes?: string | null;
          project_id?: string;
          public_summary?: string;
          repo_url?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          last_success_at: string | null;
          p256dh: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          last_success_at?: string | null;
          p256dh: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          last_success_at?: string | null;
          p256dh?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      reengagement_sends: {
        Row: {
          channel: string;
          created_at: string;
          day: string;
          id: string;
          kind: string;
          provider: string;
          user_id: string;
        };
        Insert: {
          channel?: string;
          created_at?: string;
          day?: string;
          id?: string;
          kind: string;
          provider?: string;
          user_id: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          day?: string;
          id?: string;
          kind?: string;
          provider?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      review_items: {
        Row: {
          course_id: string;
          created_at: string;
          due_on: string;
          id: string;
          interval_days: number;
          lapses: number;
          last_reviewed_at: string | null;
          lesson_id: string;
          streak: number;
          user_id: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          due_on?: string;
          id?: string;
          interval_days?: number;
          lapses?: number;
          last_reviewed_at?: string | null;
          lesson_id: string;
          streak?: number;
          user_id: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          due_on?: string;
          id?: string;
          interval_days?: number;
          lapses?: number;
          last_reviewed_at?: string | null;
          lesson_id?: string;
          streak?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_key: string;
          earned_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          achievement_key: string;
          earned_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          achievement_key?: string;
          earned_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      public_portfolio_projects: {
        Row: {
          is_published: boolean | null;
          live_url: string | null;
          project_id: string | null;
          public_summary: string | null;
          repo_url: string | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          is_published?: boolean | null;
          live_url?: string | null;
          project_id?: string | null;
          public_summary?: string | null;
          repo_url?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          is_published?: boolean | null;
          live_url?: string | null;
          project_id?: string | null;
          public_summary?: string | null;
          repo_url?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_course_usage: {
        Args: never;
        Returns: {
          completions: number;
          course_id: string;
          learners: number;
        }[];
      };
      admin_metrics: { Args: { p_days: number }; Returns: Json };
      admin_user_directory: {
        Args: { p_limit: number; p_offset: number; p_query: string };
        Returns: {
          banned_until: string;
          created_at: string;
          display_name: string;
          email: string;
          id: string;
          is_admin: boolean;
          last_active_day: string;
          last_sign_in_at: string;
          level: number;
          plan: string;
          streak_current: number;
          total: number;
          trial_ends_at: string;
          xp: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
