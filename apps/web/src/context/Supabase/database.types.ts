//GENERATED CODE: DO NOT EDIT
//USE make-types  in the database repo to regenerate

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
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
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
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
      _prisma_migrations: {
        Row: {
          applied_steps_count: number;
          checksum: string;
          finished_at: string | null;
          id: string;
          logs: string | null;
          migration_name: string;
          rolled_back_at: string | null;
          started_at: string;
        };
        Insert: {
          applied_steps_count?: number;
          checksum: string;
          finished_at?: string | null;
          id: string;
          logs?: string | null;
          migration_name: string;
          rolled_back_at?: string | null;
          started_at?: string;
        };
        Update: {
          applied_steps_count?: number;
          checksum?: string;
          finished_at?: string | null;
          id?: string;
          logs?: string | null;
          migration_name?: string;
          rolled_back_at?: string | null;
          started_at?: string;
        };
      };
      api_chats: {
        Row: {
          api_key_id: string;
          chat_id: string;
          created_at: string;
          deleted_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          api_key_id: string;
          chat_id: string;
          created_at?: string;
          deleted_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          api_key_id?: string;
          chat_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          updated_at?: string | null;
        };
      };
      api_keys: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          key: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id: string;
          key: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          key?: string;
          updated_at?: string | null;
        };
      };
      chat_to_users: {
        Row: {
          chat_id: string;
          created_at: string;
          deleted_at: string | null;
          role: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          chat_id: string;
          created_at?: string;
          deleted_at?: string | null;
          role: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          chat_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          role?: string;
          updated_at?: string | null;
          user_id?: string;
        };
      };
      chats: {
        Row: {
          created_at: string;
          data_source_id: string;
          deleted_at: string | null;
          id: string;
          name: string;
          public: boolean;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          data_source_id: string;
          deleted_at?: string | null;
          id: string;
          name: string;
          public?: boolean;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          data_source_id?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          public?: boolean;
          updated_at?: string | null;
        };
      };
      comments: {
        Row: {
          comment: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          node_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          comment: string;
          created_at?: string;
          deleted_at?: string | null;
          id: string;
          node_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          comment?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          node_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
      };
      dashboard_to_teams: {
        Row: {
          created_at: string;
          dashboard_id: string;
          deleted_at: string | null;
          sharing: boolean;
          sharing_setting: Database['public']['Enums']['dashboard_to_team_roles'];
          team_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          dashboard_id: string;
          deleted_at?: string | null;
          sharing?: boolean;
          sharing_setting?: Database['public']['Enums']['dashboard_to_team_roles'];
          team_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          dashboard_id?: string;
          deleted_at?: string | null;
          sharing?: boolean;
          sharing_setting?: Database['public']['Enums']['dashboard_to_team_roles'];
          team_id?: string;
          updated_at?: string | null;
        };
      };
      dashboard_to_users: {
        Row: {
          created_at: string;
          dashboard_id: string;
          deleted_at: string | null;
          favorited: boolean;
          role: Database['public']['Enums']['dashboard_user_roles'];
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          dashboard_id: string;
          deleted_at?: string | null;
          favorited?: boolean;
          role?: Database['public']['Enums']['dashboard_user_roles'];
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          dashboard_id?: string;
          deleted_at?: string | null;
          favorited?: boolean;
          role?: Database['public']['Enums']['dashboard_user_roles'];
          updated_at?: string | null;
          user_id?: string;
        };
      };
      dashboards: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          pinned: boolean;
          public: boolean;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id: string;
          name: string;
          pinned?: boolean;
          public?: boolean;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          pinned?: boolean;
          public?: boolean;
          updated_at?: string | null;
        };
      };
      data_source_columns: {
        Row: {
          created_at: string;
          data_source_tables_id: string;
          deleted_at: string | null;
          parent_column_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          data_source_tables_id: string;
          deleted_at?: string | null;
          parent_column_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          data_source_tables_id?: string;
          deleted_at?: string | null;
          parent_column_id?: string;
          updated_at?: string | null;
        };
      };
      data_source_permissions: {
        Row: {
          created_at: string;
          data_source_id: string;
          deleted_at: string | null;
          permission_set_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          data_source_id: string;
          deleted_at?: string | null;
          permission_set_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          data_source_id?: string;
          deleted_at?: string | null;
          permission_set_id?: string;
          updated_at?: string | null;
        };
      };
      data_source_tables: {
        Row: {
          created_at: string;
          data_source_id: string;
          deleted_at: string | null;
          id: string;
          parent_table_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          data_source_id: string;
          deleted_at?: string | null;
          id: string;
          parent_table_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          data_source_id?: string;
          deleted_at?: string | null;
          id?: string;
          parent_table_id?: string;
          updated_at?: string | null;
        };
      };
      data_sources: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          parent_id: string;
          status: Database['public']['Enums']['data_source_status'];
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id: string;
          name: string;
          parent_id: string;
          status?: Database['public']['Enums']['data_source_status'];
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          parent_id?: string;
          status?: Database['public']['Enums']['data_source_status'];
          updated_at?: string | null;
        };
      };
      glossaries: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          team_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id: string;
          name: string;
          team_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          team_id?: string;
          updated_at?: string | null;
        };
      };
      glossary_terms: {
        Row: {
          created_at: string;
          definition: string;
          deleted_at: string | null;
          glossary_id: string;
          id: string;
          term: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          definition: string;
          deleted_at?: string | null;
          glossary_id: string;
          id: string;
          term: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          definition?: string;
          deleted_at?: string | null;
          glossary_id?: string;
          id?: string;
          term?: string;
          updated_at?: string | null;
        };
      };
      message_code: {
        Row: {
          chat_id: string | null;
          code: string;
          created_at: string;
          deleted_at: string | null;
          double_checked: boolean;
          id: string;
          message_id: string | null;
          successful: boolean;
          updated_at: string | null;
        };
        Insert: {
          chat_id?: string | null;
          code: string;
          created_at?: string;
          deleted_at?: string | null;
          double_checked?: boolean;
          id: string;
          message_id?: string | null;
          successful?: boolean;
          updated_at?: string | null;
        };
        Update: {
          chat_id?: string | null;
          code?: string;
          created_at?: string;
          deleted_at?: string | null;
          double_checked?: boolean;
          id?: string;
          message_id?: string | null;
          successful?: boolean;
          updated_at?: string | null;
        };
      };
      messages: {
        Row: {
          chat_id: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          message: string;
          role: Database['public']['Enums']['message_role'];
          updated_at: string | null;
        };
        Insert: {
          chat_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id: string;
          message: string;
          role: Database['public']['Enums']['message_role'];
          updated_at?: string | null;
        };
        Update: {
          chat_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          message?: string;
          role?: Database['public']['Enums']['message_role'];
          updated_at?: string | null;
        };
      };
      nodes: {
        Row: {
          created_at: string;
          dashboard_id: string | null;
          deleted_at: string | null;
          id: string;
          node_config: Json;
          node_type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          dashboard_id?: string | null;
          deleted_at?: string | null;
          id: string;
          node_config: Json;
          node_type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          dashboard_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          node_config?: Json;
          node_type?: string;
          updated_at?: string | null;
        };
      };
      nodes_to_users: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          node_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          node_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          node_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
      };
      organization_api_keys: {
        Row: {
          api_key_id: string;
          created_at: string;
          deleted_at: string | null;
          organization_id: string;
          updated_at: string | null;
        };
        Insert: {
          api_key_id: string;
          created_at?: string;
          deleted_at?: string | null;
          organization_id: string;
          updated_at?: string | null;
        };
        Update: {
          api_key_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          organization_id?: string;
          updated_at?: string | null;
        };
      };
      organization_users: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          organization_id: string;
          role: Database['public']['Enums']['organization_role'];
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          organization_id: string;
          role: Database['public']['Enums']['organization_role'];
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          organization_id?: string;
          role?: Database['public']['Enums']['organization_role'];
          updated_at?: string | null;
          user_id?: string;
        };
      };
      organizations: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          seats: number;
          tier_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id: string;
          name: string;
          seats?: number;
          tier_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          seats?: number;
          tier_id?: string;
          updated_at?: string | null;
        };
      };
      parent_columns: {
        Row: {
          created_at: string;
          data_type: string;
          deleted_at: string | null;
          description: string | null;
          double_checked: boolean | null;
          id: string;
          name: string;
          parent_table_id: string;
          synonyms: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          data_type: string;
          deleted_at?: string | null;
          description?: string | null;
          double_checked?: boolean | null;
          id: string;
          name: string;
          parent_table_id: string;
          synonyms?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          data_type?: string;
          deleted_at?: string | null;
          description?: string | null;
          double_checked?: boolean | null;
          id?: string;
          name?: string;
          parent_table_id?: string;
          synonyms?: string | null;
          updated_at?: string | null;
        };
      };
      parent_data_sources: {
        Row: {
          configuration: Json | null;
          created_at: string;
          deleted_at: string | null;
          five_tran_id: string | null;
          id: string;
          name: string;
          status: Database['public']['Enums']['data_source_status'];
          type: string;
          updated_at: string | null;
        };
        Insert: {
          configuration?: Json | null;
          created_at?: string;
          deleted_at?: string | null;
          five_tran_id?: string | null;
          id: string;
          name: string;
          status?: Database['public']['Enums']['data_source_status'];
          type: string;
          updated_at?: string | null;
        };
        Update: {
          configuration?: Json | null;
          created_at?: string;
          deleted_at?: string | null;
          five_tran_id?: string | null;
          id?: string;
          name?: string;
          status?: Database['public']['Enums']['data_source_status'];
          type?: string;
          updated_at?: string | null;
        };
      };
      parent_tables: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          double_checked: boolean | null;
          id: string;
          name: string;
          parent_id: string;
          synonyms: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          double_checked?: boolean | null;
          id: string;
          name: string;
          parent_id: string;
          synonyms?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          double_checked?: boolean | null;
          id?: string;
          name?: string;
          parent_id?: string;
          synonyms?: string | null;
          updated_at?: string | null;
        };
      };
      permission_groups: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
      };
      permission_set_groups: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          permission_group_id: string;
          permission_set_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          permission_group_id: string;
          permission_set_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          permission_group_id?: string;
          permission_set_id?: string;
          updated_at?: string | null;
        };
      };
      permission_sets: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
      };
      team_permission_groups: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          permission_group_id: string;
          team_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          permission_group_id: string;
          team_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          permission_group_id?: string;
          team_id?: string;
          updated_at?: string | null;
        };
      };
      team_permission_sets: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          permission_set_id: string;
          team_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          permission_set_id: string;
          team_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          permission_set_id?: string;
          team_id?: string;
          updated_at?: string | null;
        };
      };
      team_users: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          role: Database['public']['Enums']['team_role'];
          team_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          role: Database['public']['Enums']['team_role'];
          team_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          role?: Database['public']['Enums']['team_role'];
          team_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
      };
      teams: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id: string;
          name: string;
          organization_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string | null;
        };
      };
      tiers: {
        Row: {
          chat_limit: number;
          column_limit: number;
          cost: number;
          created_at: string;
          data_sources_limit: number;
          deleted_at: string | null;
          id: string;
          name: string;
          permission_groups_limit: number;
          table_limit: number;
          updated_at: string | null;
        };
        Insert: {
          chat_limit?: number;
          column_limit?: number;
          cost?: number;
          created_at?: string;
          data_sources_limit?: number;
          deleted_at?: string | null;
          id: string;
          name: string;
          permission_groups_limit?: number;
          table_limit?: number;
          updated_at?: string | null;
        };
        Update: {
          chat_limit?: number;
          column_limit?: number;
          cost?: number;
          created_at?: string;
          data_sources_limit?: number;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          permission_groups_limit?: number;
          table_limit?: number;
          updated_at?: string | null;
        };
      };
      usage: {
        Row: {
          api: number;
          columns: number;
          created_at: string;
          data_sources: number;
          deleted_at: string | null;
          id: string;
          month: number;
          organization_id: string;
          permission_groups: number;
          queries: number;
          tables: number;
          updated_at: string | null;
          year: number;
        };
        Insert: {
          api: number;
          columns: number;
          created_at?: string;
          data_sources: number;
          deleted_at?: string | null;
          id: string;
          month: number;
          organization_id: string;
          permission_groups: number;
          queries: number;
          tables: number;
          updated_at?: string | null;
          year: number;
        };
        Update: {
          api?: number;
          columns?: number;
          created_at?: string;
          data_sources?: number;
          deleted_at?: string | null;
          id?: string;
          month?: number;
          organization_id?: string;
          permission_groups?: number;
          queries?: number;
          tables?: number;
          updated_at?: string | null;
          year?: number;
        };
      };
      user_permission_groups: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          permission_group_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          permission_group_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          permission_group_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
      };
      user_permission_sets: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          permission_set_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          permission_set_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          permission_set_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
      };
      users: {
        Row: {
          email: string | null;
          id: string;
          image: string | null;
          name: string | null;
          role: string | null;
          use_case: string | null;
        };
        Insert: {
          email?: string | null;
          id: string;
          image?: string | null;
          name?: string | null;
          role?: string | null;
          use_case?: string | null;
        };
        Update: {
          email?: string | null;
          id?: string;
          image?: string | null;
          name?: string | null;
          role?: string | null;
          use_case?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      chat_to_users_roles: 'owner' | 'editor' | 'viewer';
      dashboard_to_team_roles: 'owner' | 'editor' | 'viewer' | 'commenter';
      dashboard_user_roles: 'owner' | 'editor' | 'viewer' | 'commenter';
      data_source_status: 'active' | 'paused' | 'failed' | 'syncing';
      message_role: 'user' | 'system' | 'assistant';
      organization_role: 'owner' | 'admin' | 'member' | 'data';
      team_role: 'owner' | 'admin' | 'member';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string;
          name: string;
          owner: string;
          metadata: Json;
        };
        Returns: undefined;
      };
      extension: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      filename: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      foldername: {
        Args: {
          name: string;
        };
        Returns: string[];
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
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
}
