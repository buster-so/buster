export type Database = {
  public: {
    Tables: {
      __diesel_schema_migrations: {
        Row: {
          run_on: string;
          version: string;
        };
        Insert: {
          run_on?: string;
          version: string;
        };
        Update: {
          run_on?: string;
          version?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          key: string;
          organization_id: string;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          key: string;
          organization_id: string;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          key?: string;
          organization_id?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'api_keys_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'api_keys_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      asset_permissions: {
        Row: {
          asset_id: string;
          asset_type: Database['public']['Enums']['asset_type_enum'];
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          identity_id: string;
          identity_type: Database['public']['Enums']['identity_type_enum'];
          role: Database['public']['Enums']['asset_permission_role_enum'];
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          asset_id: string;
          asset_type: Database['public']['Enums']['asset_type_enum'];
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          identity_id: string;
          identity_type: Database['public']['Enums']['identity_type_enum'];
          role: Database['public']['Enums']['asset_permission_role_enum'];
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          asset_id?: string;
          asset_type?: Database['public']['Enums']['asset_type_enum'];
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          identity_id?: string;
          identity_type?: Database['public']['Enums']['identity_type_enum'];
          role?: Database['public']['Enums']['asset_permission_role_enum'];
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'asset_permissions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'asset_permissions_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      asset_search: {
        Row: {
          asset_id: string;
          asset_type: string;
          content: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          asset_id: string;
          asset_type: string;
          content: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          asset_id?: string;
          asset_type?: string;
          content?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collections_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collections_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collections_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      collections_to_assets: {
        Row: {
          asset_id: string;
          asset_type: Database['public']['Enums']['asset_type_enum'];
          collection_id: string;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          asset_id: string;
          asset_type: Database['public']['Enums']['asset_type_enum'];
          collection_id: string;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          asset_id?: string;
          asset_type?: Database['public']['Enums']['asset_type_enum'];
          collection_id?: string;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collections_to_assets_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collections_to_assets_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      dashboard_versions: {
        Row: {
          config: JSON;
          created_at: string;
          dashboard_id: string;
          deleted_at: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          config: JSON;
          created_at?: string;
          dashboard_id: string;
          deleted_at?: string | null;
          id?: string;
          updated_at?: string;
        };
        Update: {
          config?: JSON;
          created_at?: string;
          dashboard_id?: string;
          deleted_at?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dashboard_versions_dashboard_id_fkey';
            columns: ['dashboard_id'];
            isOneToOne: false;
            referencedRelation: 'dashboards';
            referencedColumns: ['id'];
          }
        ];
      };
      dashboards: {
        Row: {
          config: JSON;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          name: string;
          organization_id: string;
          password_secret_id: string | null;
          public_expiry_date: string | null;
          publicly_accessible: boolean;
          publicly_enabled_by: string | null;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          config: JSON;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          password_secret_id?: string | null;
          public_expiry_date?: string | null;
          publicly_accessible?: boolean;
          publicly_enabled_by?: string | null;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          config?: JSON;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          password_secret_id?: string | null;
          public_expiry_date?: string | null;
          publicly_accessible?: boolean;
          publicly_enabled_by?: string | null;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dashboards_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dashboards_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dashboards_publicly_enabled_by_fkey';
            columns: ['publicly_enabled_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dashboards_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      data_sources: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          env: string;
          id: string;
          name: string;
          onboarding_error: string | null;
          onboarding_status: Database['public']['Enums']['data_source_onboarding_status_enum'];
          organization_id: string;
          secret_id: string;
          type: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          env?: string;
          id?: string;
          name: string;
          onboarding_error?: string | null;
          onboarding_status?: Database['public']['Enums']['data_source_onboarding_status_enum'];
          organization_id: string;
          secret_id: string;
          type: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          env?: string;
          id?: string;
          name?: string;
          onboarding_error?: string | null;
          onboarding_status?: Database['public']['Enums']['data_source_onboarding_status_enum'];
          organization_id?: string;
          secret_id?: string;
          type?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'data_sources_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'data_sources_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'data_sources_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      dataset_columns: {
        Row: {
          created_at: string;
          dataset_id: string;
          deleted_at: string | null;
          description: string | null;
          dim_type: string | null;
          expr: string | null;
          id: string;
          name: string;
          nullable: boolean;
          semantic_type: string | null;
          stored_values: boolean | null;
          stored_values_count: number | null;
          stored_values_error: string | null;
          stored_values_last_synced: string | null;
          stored_values_status: Database['public']['Enums']['stored_values_status_enum'] | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at: string;
          dataset_id: string;
          deleted_at?: string | null;
          description?: string | null;
          dim_type?: string | null;
          expr?: string | null;
          id: string;
          name: string;
          nullable: boolean;
          semantic_type?: string | null;
          stored_values?: boolean | null;
          stored_values_count?: number | null;
          stored_values_error?: string | null;
          stored_values_last_synced?: string | null;
          stored_values_status?: Database['public']['Enums']['stored_values_status_enum'] | null;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dataset_id?: string;
          deleted_at?: string | null;
          description?: string | null;
          dim_type?: string | null;
          expr?: string | null;
          id?: string;
          name?: string;
          nullable?: boolean;
          semantic_type?: string | null;
          stored_values?: boolean | null;
          stored_values_count?: number | null;
          stored_values_error?: string | null;
          stored_values_last_synced?: string | null;
          stored_values_status?: Database['public']['Enums']['stored_values_status_enum'] | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      dataset_groups: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dataset_groups_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      dataset_groups_permissions: {
        Row: {
          created_at: string;
          dataset_group_id: string;
          deleted_at: string | null;
          id: string;
          organization_id: string;
          permission_id: string;
          permission_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dataset_group_id: string;
          deleted_at?: string | null;
          id?: string;
          organization_id: string;
          permission_id: string;
          permission_type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dataset_group_id?: string;
          deleted_at?: string | null;
          id?: string;
          organization_id?: string;
          permission_id?: string;
          permission_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dataset_groups_permissions_dataset_group_id_fkey';
            columns: ['dataset_group_id'];
            isOneToOne: false;
            referencedRelation: 'dataset_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dataset_groups_permissions_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      dataset_permissions: {
        Row: {
          created_at: string;
          dataset_id: string;
          deleted_at: string | null;
          id: string;
          organization_id: string;
          permission_id: string;
          permission_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dataset_id: string;
          deleted_at?: string | null;
          id?: string;
          organization_id: string;
          permission_id: string;
          permission_type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dataset_id?: string;
          deleted_at?: string | null;
          id?: string;
          organization_id?: string;
          permission_id?: string;
          permission_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dataset_permissions_dataset_id_fkey';
            columns: ['dataset_id'];
            isOneToOne: false;
            referencedRelation: 'datasets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dataset_permissions_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      datasets: {
        Row: {
          created_at: string;
          created_by: string;
          data_source_id: string;
          database_identifier: string | null;
          database_name: string;
          definition: string;
          deleted_at: string | null;
          enabled: boolean;
          id: string;
          imported: boolean;
          model: string | null;
          name: string;
          organization_id: string;
          schema: string;
          type: Database['public']['Enums']['dataset_type_enum'];
          updated_at: string;
          updated_by: string;
          when_not_to_use: string | null;
          when_to_use: string | null;
          yml_file: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          data_source_id: string;
          database_identifier?: string | null;
          database_name: string;
          definition: string;
          deleted_at?: string | null;
          enabled?: boolean;
          id?: string;
          imported?: boolean;
          model?: string | null;
          name: string;
          organization_id: string;
          schema: string;
          type: Database['public']['Enums']['dataset_type_enum'];
          updated_at?: string;
          updated_by: string;
          when_not_to_use?: string | null;
          when_to_use?: string | null;
          yml_file?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          data_source_id?: string;
          database_identifier?: string | null;
          database_name?: string;
          definition?: string;
          deleted_at?: string | null;
          enabled?: boolean;
          id?: string;
          imported?: boolean;
          model?: string | null;
          name?: string;
          organization_id?: string;
          schema?: string;
          type?: Database['public']['Enums']['dataset_type_enum'];
          updated_at?: string;
          updated_by?: string;
          when_not_to_use?: string | null;
          when_to_use?: string | null;
          yml_file?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'datasets_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'datasets_data_source_id_fkey';
            columns: ['data_source_id'];
            isOneToOne: false;
            referencedRelation: 'data_sources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'datasets_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'datasets_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      datasets_to_dataset_groups: {
        Row: {
          created_at: string;
          dataset_group_id: string;
          dataset_id: string;
          deleted_at: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dataset_group_id: string;
          dataset_id: string;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dataset_group_id?: string;
          dataset_id?: string;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'datasets_to_dataset_groups_dataset_group_id_fkey';
            columns: ['dataset_group_id'];
            isOneToOne: false;
            referencedRelation: 'dataset_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'datasets_to_dataset_groups_dataset_id_fkey';
            columns: ['dataset_id'];
            isOneToOne: false;
            referencedRelation: 'datasets';
            referencedColumns: ['id'];
          }
        ];
      };
      datasets_to_permission_groups: {
        Row: {
          created_at: string;
          dataset_id: string;
          deleted_at: string | null;
          permission_group_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dataset_id: string;
          deleted_at?: string | null;
          permission_group_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dataset_id?: string;
          deleted_at?: string | null;
          permission_group_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'datasets_to_permission_groups_dataset_id_fkey';
            columns: ['dataset_id'];
            isOneToOne: false;
            referencedRelation: 'datasets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'datasets_to_permission_groups_permission_group_id_fkey';
            columns: ['permission_group_id'];
            isOneToOne: false;
            referencedRelation: 'permission_groups';
            referencedColumns: ['id'];
          }
        ];
      };
      entity_relationship: {
        Row: {
          created_at: string;
          foreign_dataset_id: string;
          primary_dataset_id: string;
          relationship_type: string;
        };
        Insert: {
          created_at?: string;
          foreign_dataset_id: string;
          primary_dataset_id: string;
          relationship_type: string;
        };
        Update: {
          created_at?: string;
          foreign_dataset_id?: string;
          primary_dataset_id?: string;
          relationship_type?: string;
        };
        Relationships: [];
      };
      flow_watermarks: {
        Row: {
          slot: string;
          watermark: string | null;
        };
        Insert: {
          slot: string;
          watermark?: string | null;
        };
        Update: {
          slot?: string;
          watermark?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          chart_config: JSON | null;
          chart_recommendations: JSON | null;
          code: string | null;
          context: JSON | null;
          created_at: string;
          data_metadata: JSON | null;
          dataset_id: string | null;
          deleted_at: string | null;
          draft_session_id: string | null;
          draft_state: JSON | null;
          feedback: Database['public']['Enums']['message_feedback_enum'] | null;
          id: string;
          message: string;
          responses: JSON | null;
          sent_by: string;
          sql_evaluation_id: string | null;
          summary_question: string | null;
          thread_id: string;
          time_frame: string | null;
          title: string | null;
          updated_at: string;
          verification: Database['public']['Enums']['verification_enum'];
        };
        Insert: {
          chart_config?: JSON | null;
          chart_recommendations?: JSON | null;
          code?: string | null;
          context?: JSON | null;
          created_at?: string;
          data_metadata?: JSON | null;
          dataset_id?: string | null;
          deleted_at?: string | null;
          draft_session_id?: string | null;
          draft_state?: JSON | null;
          feedback?: Database['public']['Enums']['message_feedback_enum'] | null;
          id?: string;
          message: string;
          responses?: JSON | null;
          sent_by: string;
          sql_evaluation_id?: string | null;
          summary_question?: string | null;
          thread_id: string;
          time_frame?: string | null;
          title?: string | null;
          updated_at?: string;
          verification?: Database['public']['Enums']['verification_enum'];
        };
        Update: {
          chart_config?: JSON | null;
          chart_recommendations?: JSON | null;
          code?: string | null;
          context?: JSON | null;
          created_at?: string;
          data_metadata?: JSON | null;
          dataset_id?: string | null;
          deleted_at?: string | null;
          draft_session_id?: string | null;
          draft_state?: JSON | null;
          feedback?: Database['public']['Enums']['message_feedback_enum'] | null;
          id?: string;
          message?: string;
          responses?: JSON | null;
          sent_by?: string;
          sql_evaluation_id?: string | null;
          summary_question?: string | null;
          thread_id?: string;
          time_frame?: string | null;
          title?: string | null;
          updated_at?: string;
          verification?: Database['public']['Enums']['verification_enum'];
        };
        Relationships: [
          {
            foreignKeyName: 'messages_dataset_id_fkey';
            columns: ['dataset_id'];
            isOneToOne: false;
            referencedRelation: 'datasets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sent_by_fkey';
            columns: ['sent_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_thread_id_fkey';
            columns: ['thread_id'];
            isOneToOne: false;
            referencedRelation: 'threads';
            referencedColumns: ['id'];
          }
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          domain: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          domain?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          domain?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      permission_groups: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'permission_groups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'permission_groups_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'permission_groups_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      permission_groups_to_identities: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          identity_id: string;
          identity_type: Database['public']['Enums']['identity_type_enum'];
          permission_group_id: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          identity_id: string;
          identity_type: Database['public']['Enums']['identity_type_enum'];
          permission_group_id: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          identity_id?: string;
          identity_type?: Database['public']['Enums']['identity_type_enum'];
          permission_group_id?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'permission_groups_to_identities_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'permission_groups_to_identities_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      permission_groups_to_users: {
        Row: {
          created_at: string;
          permission_group_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          permission_group_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          permission_group_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'permission_groups_to_users_permission_group_id_fkey';
            columns: ['permission_group_id'];
            isOneToOne: false;
            referencedRelation: 'permission_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'permission_groups_to_users_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      sql_evaluations: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          evaluation_obj: JSON;
          evaluation_summary: string;
          id: string;
          score: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          evaluation_obj: JSON;
          evaluation_summary: string;
          id?: string;
          score: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          evaluation_obj?: JSON;
          evaluation_summary?: string;
          id?: string;
          score?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          edit_sql: boolean;
          email_slack_enabled: boolean;
          export_assets: boolean;
          id: string;
          name: string;
          organization_id: string;
          sharing_setting: Database['public']['Enums']['sharing_setting_enum'];
          updated_at: string;
          upload_csv: boolean;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          edit_sql?: boolean;
          email_slack_enabled?: boolean;
          export_assets?: boolean;
          id?: string;
          name: string;
          organization_id: string;
          sharing_setting?: Database['public']['Enums']['sharing_setting_enum'];
          updated_at?: string;
          upload_csv?: boolean;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          edit_sql?: boolean;
          email_slack_enabled?: boolean;
          export_assets?: boolean;
          id?: string;
          name?: string;
          organization_id?: string;
          sharing_setting?: Database['public']['Enums']['sharing_setting_enum'];
          updated_at?: string;
          upload_csv?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'teams_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'teams_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      teams_to_users: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          role: Database['public']['Enums']['team_role_enum'];
          team_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          role?: Database['public']['Enums']['team_role_enum'];
          team_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          role?: Database['public']['Enums']['team_role_enum'];
          team_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teams_to_users_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'teams_to_users_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      terms: {
        Row: {
          created_at: string;
          created_by: string;
          definition: string | null;
          deleted_at: string | null;
          id: string;
          name: string;
          organization_id: string;
          sql_snippet: string | null;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          definition?: string | null;
          deleted_at?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          sql_snippet?: string | null;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          definition?: string | null;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          sql_snippet?: string | null;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'terms_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'terms_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'terms_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      terms_search: {
        Row: {
          content: string;
          created_at: string;
          definition: string;
          deleted_at: string | null;
          embedding: string | null;
          fts: unknown | null;
          id: string;
          organization_id: string;
          term_id: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          definition: string;
          deleted_at?: string | null;
          embedding?: string | null;
          fts?: unknown | null;
          id?: string;
          organization_id: string;
          term_id: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          definition?: string;
          deleted_at?: string | null;
          embedding?: string | null;
          fts?: unknown | null;
          id?: string;
          organization_id?: string;
          term_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'terms_search_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      terms_to_datasets: {
        Row: {
          created_at: string;
          dataset_id: string;
          deleted_at: string | null;
          term_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dataset_id: string;
          deleted_at?: string | null;
          term_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dataset_id?: string;
          deleted_at?: string | null;
          term_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'terms_to_datasets_dataset_id_fkey';
            columns: ['dataset_id'];
            isOneToOne: false;
            referencedRelation: 'datasets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'terms_to_datasets_term_id_fkey';
            columns: ['term_id'];
            isOneToOne: false;
            referencedRelation: 'terms';
            referencedColumns: ['id'];
          }
        ];
      };
      threads: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          id: string;
          organization_id: string;
          parent_thread_id: string | null;
          password_secret_id: string | null;
          public_expiry_date: string | null;
          publicly_accessible: boolean;
          publicly_enabled_by: string | null;
          state_message_id: string | null;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          id?: string;
          organization_id: string;
          parent_thread_id?: string | null;
          password_secret_id?: string | null;
          public_expiry_date?: string | null;
          publicly_accessible?: boolean;
          publicly_enabled_by?: string | null;
          state_message_id?: string | null;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          id?: string;
          organization_id?: string;
          parent_thread_id?: string | null;
          password_secret_id?: string | null;
          public_expiry_date?: string | null;
          publicly_accessible?: boolean;
          publicly_enabled_by?: string | null;
          state_message_id?: string | null;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'threads_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'threads_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'threads_parent_thread_id_fkey';
            columns: ['parent_thread_id'];
            isOneToOne: false;
            referencedRelation: 'threads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'threads_publicly_enabled_by_fkey';
            columns: ['publicly_enabled_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'threads_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      threads_to_dashboards: {
        Row: {
          added_by: string;
          created_at: string;
          dashboard_id: string;
          deleted_at: string | null;
          thread_id: string;
          updated_at: string;
        };
        Insert: {
          added_by: string;
          created_at?: string;
          dashboard_id: string;
          deleted_at?: string | null;
          thread_id: string;
          updated_at?: string;
        };
        Update: {
          added_by?: string;
          created_at?: string;
          dashboard_id?: string;
          deleted_at?: string | null;
          thread_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'threads_to_dashboards_added_by_fkey';
            columns: ['added_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'threads_to_dashboards_dashboard_id_fkey';
            columns: ['dashboard_id'];
            isOneToOne: false;
            referencedRelation: 'dashboards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'threads_to_dashboards_thread_id_fkey';
            columns: ['thread_id'];
            isOneToOne: false;
            referencedRelation: 'threads';
            referencedColumns: ['id'];
          }
        ];
      };
      user_favorites: {
        Row: {
          asset_id: string;
          asset_type: Database['public']['Enums']['asset_type_enum'];
          created_at: string;
          deleted_at: string | null;
          order_index: number;
          user_id: string;
        };
        Insert: {
          asset_id: string;
          asset_type: Database['public']['Enums']['asset_type_enum'];
          created_at?: string;
          deleted_at?: string | null;
          order_index: number;
          user_id: string;
        };
        Update: {
          asset_id?: string;
          asset_type?: Database['public']['Enums']['asset_type_enum'];
          created_at?: string;
          deleted_at?: string | null;
          order_index?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_favorites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      users: {
        Row: {
          attributes: JSON;
          config: JSON;
          created_at: string;
          email: string;
          id: string;
          name: string | null;
          updated_at: string;
        };
        Insert: {
          attributes?: JSON;
          config?: JSON;
          created_at?: string;
          email: string;
          id?: string;
          name?: string | null;
          updated_at?: string;
        };
        Update: {
          attributes?: JSON;
          config?: JSON;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      users_to_organizations: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          edit_sql: boolean;
          email_slack_enabled: boolean;
          export_assets: boolean;
          organization_id: string;
          role: Database['public']['Enums']['user_organization_role_enum'];
          sharing_setting: Database['public']['Enums']['sharing_setting_enum'];
          status: Database['public']['Enums']['user_organization_status_enum'];
          updated_at: string;
          updated_by: string;
          upload_csv: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          edit_sql?: boolean;
          email_slack_enabled?: boolean;
          export_assets?: boolean;
          organization_id: string;
          role?: Database['public']['Enums']['user_organization_role_enum'];
          sharing_setting?: Database['public']['Enums']['sharing_setting_enum'];
          status?: Database['public']['Enums']['user_organization_status_enum'];
          updated_at?: string;
          updated_by: string;
          upload_csv?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          edit_sql?: boolean;
          email_slack_enabled?: boolean;
          export_assets?: boolean;
          organization_id?: string;
          role?: Database['public']['Enums']['user_organization_role_enum'];
          sharing_setting?: Database['public']['Enums']['sharing_setting_enum'];
          status?: Database['public']['Enums']['user_organization_status_enum'];
          updated_at?: string;
          updated_by?: string;
          upload_csv?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_to_organizations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'users_to_organizations_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'users_to_organizations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'users_to_organizations_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'users_to_organizations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      binary_quantize:
        | {
            Args: {
              '': string;
            };
            Returns: unknown;
          }
        | {
            Args: {
              '': unknown;
            };
            Returns: unknown;
          };
      delete_old_anon_users: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      halfvec_avg: {
        Args: {
          '': number[];
        };
        Returns: unknown;
      };
      halfvec_out: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      halfvec_send: {
        Args: {
          '': unknown;
        };
        Returns: string;
      };
      halfvec_typmod_in: {
        Args: {
          '': unknown[];
        };
        Returns: number;
      };
      hnsw_bit_support: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      hnsw_halfvec_support: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      hnsw_sparsevec_support: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      hnswhandler: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      ivfflat_bit_support: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      ivfflat_halfvec_support: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      ivfflathandler: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      l2_norm:
        | {
            Args: {
              '': unknown;
            };
            Returns: number;
          }
        | {
            Args: {
              '': unknown;
            };
            Returns: number;
          };
      l2_normalize:
        | {
            Args: {
              '': string;
            };
            Returns: string;
          }
        | {
            Args: {
              '': unknown;
            };
            Returns: unknown;
          }
        | {
            Args: {
              '': unknown;
            };
            Returns: unknown;
          };
      pgroonga_command:
        | {
            Args: {
              groongacommand: string;
            };
            Returns: string;
          }
        | {
            Args: {
              groongacommand: string;
              arguments: string[];
            };
            Returns: string;
          };
      pgroonga_command_escape_value: {
        Args: {
          value: string;
        };
        Returns: string;
      };
      pgroonga_equal_query_text_array: {
        Args: {
          targets: string[];
          query: string;
        };
        Returns: boolean;
      };
      pgroonga_equal_query_varchar_array: {
        Args: {
          targets: string[];
          query: string;
        };
        Returns: boolean;
      };
      pgroonga_equal_text: {
        Args: {
          target: string;
          other: string;
        };
        Returns: boolean;
      };
      pgroonga_equal_text_condition: {
        Args: {
          target: string;
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition'];
        };
        Returns: boolean;
      };
      pgroonga_equal_varchar: {
        Args: {
          target: string;
          other: string;
        };
        Returns: boolean;
      };
      pgroonga_equal_varchar_condition: {
        Args: {
          target: string;
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition'];
        };
        Returns: boolean;
      };
      pgroonga_escape:
        | {
            Args: {
              value: boolean;
            };
            Returns: string;
          }
        | {
            Args: {
              value: number;
            };
            Returns: string;
          }
        | {
            Args: {
              value: number;
            };
            Returns: string;
          }
        | {
            Args: {
              value: number;
            };
            Returns: string;
          }
        | {
            Args: {
              value: number;
            };
            Returns: string;
          }
        | {
            Args: {
              value: number;
            };
            Returns: string;
          }
        | {
            Args: {
              value: string;
            };
            Returns: string;
          }
        | {
            Args: {
              value: string;
            };
            Returns: string;
          }
        | {
            Args: {
              value: string;
            };
            Returns: string;
          }
        | {
            Args: {
              value: string;
              special_characters: string;
            };
            Returns: string;
          };
      pgroonga_flush: {
        Args: {
          indexname: unknown;
        };
        Returns: boolean;
      };
      pgroonga_handler: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      pgroonga_highlight_html:
        | {
            Args: {
              target: string;
              keywords: string[];
            };
            Returns: string;
          }
        | {
            Args: {
              target: string;
              keywords: string[];
              indexname: unknown;
            };
            Returns: string;
          }
        | {
            Args: {
              targets: string[];
              keywords: string[];
            };
            Returns: string[];
          }
        | {
            Args: {
              targets: string[];
              keywords: string[];
              indexname: unknown;
            };
            Returns: string[];
          };
      pgroonga_index_column_name:
        | {
            Args: {
              indexname: unknown;
              columnindex: number;
            };
            Returns: string;
          }
        | {
            Args: {
              indexname: unknown;
              columnname: string;
            };
            Returns: string;
          };
      pgroonga_is_writable: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      pgroonga_match_positions_byte:
        | {
            Args: {
              target: string;
              keywords: string[];
            };
            Returns: number[];
          }
        | {
            Args: {
              target: string;
              keywords: string[];
              indexname: unknown;
            };
            Returns: number[];
          };
      pgroonga_match_positions_character:
        | {
            Args: {
              target: string;
              keywords: string[];
            };
            Returns: number[];
          }
        | {
            Args: {
              target: string;
              keywords: string[];
              indexname: unknown;
            };
            Returns: number[];
          };
      pgroonga_match_term:
        | {
            Args: {
              target: string[];
              term: string;
            };
            Returns: boolean;
          }
        | {
            Args: {
              target: string[];
              term: string;
            };
            Returns: boolean;
          }
        | {
            Args: {
              target: string;
              term: string;
            };
            Returns: boolean;
          }
        | {
            Args: {
              target: string;
              term: string;
            };
            Returns: boolean;
          };
      pgroonga_match_text_array_condition: {
        Args: {
          target: string[];
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition'];
        };
        Returns: boolean;
      };
      pgroonga_match_text_array_condition_with_scorers: {
        Args: {
          target: string[];
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition_with_scorers'];
        };
        Returns: boolean;
      };
      pgroonga_match_text_condition: {
        Args: {
          target: string;
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition'];
        };
        Returns: boolean;
      };
      pgroonga_match_text_condition_with_scorers: {
        Args: {
          target: string;
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition_with_scorers'];
        };
        Returns: boolean;
      };
      pgroonga_match_varchar_condition: {
        Args: {
          target: string;
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition'];
        };
        Returns: boolean;
      };
      pgroonga_match_varchar_condition_with_scorers: {
        Args: {
          target: string;
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition_with_scorers'];
        };
        Returns: boolean;
      };
      pgroonga_normalize:
        | {
            Args: {
              target: string;
            };
            Returns: string;
          }
        | {
            Args: {
              target: string;
              normalizername: string;
            };
            Returns: string;
          };
      pgroonga_prefix_varchar_condition: {
        Args: {
          target: string;
          conditoin: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition'];
        };
        Returns: boolean;
      };
      pgroonga_query_escape: {
        Args: {
          query: string;
        };
        Returns: string;
      };
      pgroonga_query_expand: {
        Args: {
          tablename: unknown;
          termcolumnname: string;
          synonymscolumnname: string;
          query: string;
        };
        Returns: string;
      };
      pgroonga_query_extract_keywords: {
        Args: {
          query: string;
          index_name?: string;
        };
        Returns: string[];
      };
      pgroonga_query_text_array_condition: {
        Args: {
          targets: string[];
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition'];
        };
        Returns: boolean;
      };
      pgroonga_query_text_array_condition_with_scorers: {
        Args: {
          targets: string[];
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition_with_scorers'];
        };
        Returns: boolean;
      };
      pgroonga_query_text_condition: {
        Args: {
          target: string;
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition'];
        };
        Returns: boolean;
      };
      pgroonga_query_text_condition_with_scorers: {
        Args: {
          target: string;
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition_with_scorers'];
        };
        Returns: boolean;
      };
      pgroonga_query_varchar_condition: {
        Args: {
          target: string;
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition'];
        };
        Returns: boolean;
      };
      pgroonga_query_varchar_condition_with_scorers: {
        Args: {
          target: string;
          condition: Database['public']['CompositeTypes']['pgroonga_full_text_search_condition_with_scorers'];
        };
        Returns: boolean;
      };
      pgroonga_result_to_jsonb_objects: {
        Args: {
          result: JSON;
        };
        Returns: JSON;
      };
      pgroonga_result_to_recordset: {
        Args: {
          result: JSON;
        };
        Returns: Record<string, unknown>[];
      };
      pgroonga_score:
        | {
            Args: {
              row: Record<string, unknown>;
            };
            Returns: number;
          }
        | {
            Args: {
              tableoid: unknown;
              ctid: unknown;
            };
            Returns: number;
          };
      pgroonga_set_writable: {
        Args: {
          newwritable: boolean;
        };
        Returns: boolean;
      };
      pgroonga_snippet_html: {
        Args: {
          target: string;
          keywords: string[];
          width?: number;
        };
        Returns: string[];
      };
      pgroonga_table_name: {
        Args: {
          indexname: unknown;
        };
        Returns: string;
      };
      pgroonga_tokenize: {
        Args: {
          target: string;
        };
        Returns: JSON[];
      };
      pgroonga_vacuum: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      pgroonga_wal_apply:
        | {
            Args: Record<PropertyKey, never>;
            Returns: number;
          }
        | {
            Args: {
              indexname: unknown;
            };
            Returns: number;
          };
      pgroonga_wal_set_applied_position:
        | {
            Args: Record<PropertyKey, never>;
            Returns: boolean;
          }
        | {
            Args: {
              block: number;
              offset: number;
            };
            Returns: boolean;
          }
        | {
            Args: {
              indexname: unknown;
            };
            Returns: boolean;
          }
        | {
            Args: {
              indexname: unknown;
              block: number;
              offset: number;
            };
            Returns: boolean;
          };
      pgroonga_wal_status: {
        Args: Record<PropertyKey, never>;
        Returns: {
          name: string;
          oid: unknown;
          current_block: number;
          current_offset: number;
          current_size: number;
          last_block: number;
          last_offset: number;
          last_size: number;
        }[];
      };
      pgroonga_wal_truncate:
        | {
            Args: Record<PropertyKey, never>;
            Returns: number;
          }
        | {
            Args: {
              indexname: unknown;
            };
            Returns: number;
          };
      sparsevec_out: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      sparsevec_send: {
        Args: {
          '': unknown;
        };
        Returns: string;
      };
      sparsevec_typmod_in: {
        Args: {
          '': unknown[];
        };
        Returns: number;
      };
      vector_avg: {
        Args: {
          '': number[];
        };
        Returns: string;
      };
      vector_dims:
        | {
            Args: {
              '': string;
            };
            Returns: number;
          }
        | {
            Args: {
              '': unknown;
            };
            Returns: number;
          };
      vector_norm: {
        Args: {
          '': string;
        };
        Returns: number;
      };
      vector_out: {
        Args: {
          '': string;
        };
        Returns: unknown;
      };
      vector_send: {
        Args: {
          '': string;
        };
        Returns: string;
      };
      vector_typmod_in: {
        Args: {
          '': unknown[];
        };
        Returns: number;
      };
    };
    Enums: {
      asset_permission_role_enum: 'owner' | 'editor' | 'viewer';
      asset_type_enum: 'dashboard' | 'thread' | 'collection';
      data_source_onboarding_status_enum: 'notStarted' | 'inProgress' | 'completed' | 'failed';
      dataset_type_enum: 'table' | 'view' | 'materializedView';
      identity_type_enum: 'user' | 'team' | 'organization';
      message_feedback_enum: 'positive' | 'negative';
      sharing_setting_enum: 'none' | 'team' | 'organization' | 'public';
      stored_values_status_enum: 'syncing' | 'success' | 'failed';
      team_role_enum: 'manager' | 'member';
      user_organization_role_enum:
        | 'workspace_admin'
        | 'data_admin'
        | 'querier'
        | 'restricted_querier'
        | 'viewer';
      user_organization_status_enum: 'active' | 'inactive' | 'pending' | 'guest';
      verification_enum: 'verified' | 'backlogged' | 'inReview' | 'requested' | 'notRequested';
    };
    CompositeTypes: {
      pgroonga_full_text_search_condition: {
        query: string | null;
        weigths: number[] | null;
        indexname: string | null;
      };
      pgroonga_full_text_search_condition_with_scorers: {
        query: string | null;
        weigths: number[] | null;
        scorers: string[] | null;
        indexname: string | null;
      };
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
