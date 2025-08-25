// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "asset_permission_role_enum"))]
    pub struct AssetPermissionRoleEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "asset_type_enum"))]
    pub struct AssetTypeEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "data_source_onboarding_status_enum"))]
    pub struct DataSourceOnboardingStatusEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "dataset_type_enum"))]
    pub struct DatasetTypeEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "identity_type_enum"))]
    pub struct IdentityTypeEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "message_feedback_enum"))]
    pub struct MessageFeedbackEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "sharing_setting_enum"))]
    pub struct SharingSettingEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "stored_values_status_enum"))]
    pub struct StoredValuesStatusEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "team_role_enum"))]
    pub struct TeamRoleEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "user_organization_role_enum"))]
    pub struct UserOrganizationRoleEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "user_organization_status_enum"))]
    pub struct UserOrganizationStatusEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "verification_enum"))]
    pub struct VerificationEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "workspace_sharing_enum"))]
    pub struct WorkspaceSharingEnum;
}

diesel::table! {
    api_keys (id) {
        id -> Uuid,
        owner_id -> Uuid,
        key -> Text,
        organization_id -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::IdentityTypeEnum;
    use super::sql_types::AssetTypeEnum;
    use super::sql_types::AssetPermissionRoleEnum;

    asset_permissions (identity_id, asset_id, asset_type, identity_type) {
        identity_id -> Uuid,
        identity_type -> IdentityTypeEnum,
        asset_id -> Uuid,
        asset_type -> AssetTypeEnum,
        role -> AssetPermissionRoleEnum,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        created_by -> Uuid,
        updated_by -> Uuid,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::WorkspaceSharingEnum;

    chats (id) {
        id -> Uuid,
        title -> Text,
        organization_id -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        created_by -> Uuid,
        updated_by -> Uuid,
        publicly_accessible -> Bool,
        publicly_enabled_by -> Nullable<Uuid>,
        public_expiry_date -> Nullable<Timestamptz>,
        most_recent_file_id -> Nullable<Uuid>,
        #[max_length = 255]
        most_recent_file_type -> Nullable<Varchar>,
        most_recent_version_number -> Nullable<Int4>,
        workspace_sharing -> WorkspaceSharingEnum,
        workspace_sharing_enabled_by -> Nullable<Uuid>,
        workspace_sharing_enabled_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::WorkspaceSharingEnum;

    collections (id) {
        id -> Uuid,
        name -> Text,
        description -> Nullable<Text>,
        created_by -> Uuid,
        updated_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        organization_id -> Uuid,
        workspace_sharing -> WorkspaceSharingEnum,
        workspace_sharing_enabled_by -> Nullable<Uuid>,
        workspace_sharing_enabled_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::AssetTypeEnum;

    collections_to_assets (collection_id, asset_id, asset_type) {
        collection_id -> Uuid,
        asset_id -> Uuid,
        asset_type -> AssetTypeEnum,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        created_by -> Uuid,
        updated_by -> Uuid,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::WorkspaceSharingEnum;

    dashboard_files (id) {
        id -> Uuid,
        name -> Varchar,
        file_name -> Varchar,
        content -> Jsonb,
        filter -> Nullable<Varchar>,
        organization_id -> Uuid,
        created_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        publicly_accessible -> Bool,
        publicly_enabled_by -> Nullable<Uuid>,
        public_expiry_date -> Nullable<Timestamptz>,
        version_history -> Jsonb,
        public_password -> Nullable<Text>,
        workspace_sharing -> WorkspaceSharingEnum,
        workspace_sharing_enabled_by -> Nullable<Uuid>,
        workspace_sharing_enabled_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    dashboard_versions (id) {
        id -> Uuid,
        dashboard_id -> Uuid,
        config -> Jsonb,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    dashboards (id) {
        id -> Uuid,
        name -> Text,
        description -> Nullable<Text>,
        config -> Jsonb,
        publicly_accessible -> Bool,
        publicly_enabled_by -> Nullable<Uuid>,
        public_expiry_date -> Nullable<Timestamptz>,
        password_secret_id -> Nullable<Uuid>,
        created_by -> Uuid,
        updated_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        organization_id -> Uuid,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::DataSourceOnboardingStatusEnum;

    data_sources (id) {
        id -> Uuid,
        name -> Text,
        #[sql_name = "type"]
        type_ -> Text,
        secret_id -> Uuid,
        onboarding_status -> DataSourceOnboardingStatusEnum,
        onboarding_error -> Nullable<Text>,
        organization_id -> Uuid,
        created_by -> Uuid,
        updated_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        env -> Varchar,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::StoredValuesStatusEnum;

    dataset_columns (id) {
        id -> Uuid,
        dataset_id -> Uuid,
        name -> Text,
        #[sql_name = "type"]
        type_ -> Text,
        description -> Nullable<Text>,
        nullable -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        stored_values -> Nullable<Bool>,
        stored_values_status -> Nullable<StoredValuesStatusEnum>,
        stored_values_error -> Nullable<Text>,
        stored_values_count -> Nullable<Int8>,
        stored_values_last_synced -> Nullable<Timestamptz>,
        semantic_type -> Nullable<Text>,
        dim_type -> Nullable<Text>,
        expr -> Nullable<Text>,
    }
}

diesel::table! {
    dataset_groups (id) {
        id -> Uuid,
        organization_id -> Uuid,
        name -> Varchar,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    dataset_groups_permissions (id) {
        id -> Uuid,
        dataset_group_id -> Uuid,
        permission_id -> Uuid,
        permission_type -> Varchar,
        organization_id -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    dataset_permissions (id) {
        id -> Uuid,
        organization_id -> Uuid,
        dataset_id -> Uuid,
        permission_id -> Uuid,
        permission_type -> Varchar,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::DatasetTypeEnum;

    datasets (id) {
        id -> Uuid,
        name -> Text,
        database_name -> Text,
        when_to_use -> Nullable<Text>,
        when_not_to_use -> Nullable<Text>,
        #[sql_name = "type"]
        type_ -> DatasetTypeEnum,
        definition -> Text,
        schema -> Text,
        enabled -> Bool,
        imported -> Bool,
        data_source_id -> Uuid,
        organization_id -> Uuid,
        created_by -> Uuid,
        updated_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        model -> Nullable<Text>,
        yml_file -> Nullable<Text>,
        database_identifier -> Nullable<Text>,
    }
}

diesel::table! {
    datasets_to_dataset_groups (dataset_id, dataset_group_id) {
        dataset_id -> Uuid,
        dataset_group_id -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    datasets_to_permission_groups (dataset_id, permission_group_id) {
        dataset_id -> Uuid,
        permission_group_id -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    entity_relationship (primary_dataset_id, foreign_dataset_id) {
        primary_dataset_id -> Uuid,
        foreign_dataset_id -> Uuid,
        relationship_type -> Text,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    messages (id) {
        id -> Uuid,
        request_message -> Nullable<Text>,
        response_messages -> Jsonb,
        reasoning -> Jsonb,
        title -> Text,
        raw_llm_messages -> Jsonb,
        final_reasoning_message -> Nullable<Text>,
        chat_id -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        created_by -> Uuid,
        feedback -> Nullable<Text>,
        is_completed -> Bool,
        post_processing_message -> Nullable<Jsonb>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::MessageFeedbackEnum;
    use super::sql_types::VerificationEnum;

    messages_deprecated (id) {
        id -> Uuid,
        thread_id -> Uuid,
        sent_by -> Uuid,
        message -> Text,
        responses -> Nullable<Jsonb>,
        code -> Nullable<Text>,
        context -> Nullable<Jsonb>,
        title -> Nullable<Text>,
        feedback -> Nullable<MessageFeedbackEnum>,
        verification -> VerificationEnum,
        dataset_id -> Nullable<Uuid>,
        chart_config -> Nullable<Jsonb>,
        chart_recommendations -> Nullable<Jsonb>,
        time_frame -> Nullable<Text>,
        data_metadata -> Nullable<Jsonb>,
        draft_session_id -> Nullable<Uuid>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        draft_state -> Nullable<Jsonb>,
        summary_question -> Nullable<Text>,
        sql_evaluation_id -> Nullable<Uuid>,
    }
}

diesel::table! {
    messages_to_files (id) {
        id -> Uuid,
        message_id -> Uuid,
        file_id -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        is_duplicate -> Bool,
        version_number -> Int4,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::VerificationEnum;
    use super::sql_types::WorkspaceSharingEnum;

    metric_files (id) {
        id -> Uuid,
        name -> Varchar,
        file_name -> Varchar,
        content -> Jsonb,
        verification -> VerificationEnum,
        evaluation_obj -> Nullable<Jsonb>,
        evaluation_summary -> Nullable<Text>,
        evaluation_score -> Nullable<Float8>,
        organization_id -> Uuid,
        created_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        publicly_accessible -> Bool,
        publicly_enabled_by -> Nullable<Uuid>,
        public_expiry_date -> Nullable<Timestamptz>,
        version_history -> Jsonb,
        data_metadata -> Nullable<Jsonb>,
        public_password -> Nullable<Text>,
        data_source_id -> Uuid,
        workspace_sharing -> WorkspaceSharingEnum,
        workspace_sharing_enabled_by -> Nullable<Uuid>,
        workspace_sharing_enabled_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    metric_files_to_dashboard_files (metric_file_id, dashboard_file_id) {
        metric_file_id -> Uuid,
        dashboard_file_id -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        created_by -> Uuid,
    }
}

diesel::table! {
    metric_files_to_datasets (metric_file_id, metric_version_number, dataset_id) {
        metric_file_id -> Uuid,
        dataset_id -> Uuid,
        metric_version_number -> Int4,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::WorkspaceSharingEnum;

    report_files (id) {
        id -> Uuid,
        name -> Varchar,
        content -> Text,
        organization_id -> Uuid,
        created_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        publicly_accessible -> Bool,
        publicly_enabled_by -> Nullable<Uuid>,
        public_expiry_date -> Nullable<Timestamptz>,
        version_history -> Jsonb,
        public_password -> Nullable<Text>,
        workspace_sharing -> WorkspaceSharingEnum,
        workspace_sharing_enabled_by -> Nullable<Uuid>,
        workspace_sharing_enabled_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::UserOrganizationRoleEnum;

    organizations (id) {
        id -> Uuid,
        name -> Text,
        domain -> Nullable<Text>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        payment_required -> Bool,
        domains -> Nullable<Array<Text>>,
        restrict_new_user_invitations -> Bool,
        default_role -> UserOrganizationRoleEnum,
        organization_color_palettes -> Jsonb,
    }
}

diesel::table! {
    permission_groups (id) {
        id -> Uuid,
        name -> Text,
        organization_id -> Uuid,
        created_by -> Uuid,
        updated_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::IdentityTypeEnum;

    permission_groups_to_identities (permission_group_id, identity_id, identity_type) {
        permission_group_id -> Uuid,
        identity_id -> Uuid,
        identity_type -> IdentityTypeEnum,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        created_by -> Uuid,
        updated_by -> Uuid,
    }
}

diesel::table! {
    permission_groups_to_users (permission_group_id, user_id) {
        permission_group_id -> Uuid,
        user_id -> Uuid,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    sql_evaluations (id) {
        id -> Uuid,
        evaluation_obj -> Jsonb,
        evaluation_summary -> Text,
        score -> Text,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    stored_values_sync_jobs (id) {
        id -> Uuid,
        data_source_id -> Uuid,
        database_name -> Text,
        schema_name -> Text,
        table_name -> Text,
        column_name -> Text,
        last_synced_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        status -> Text,
        error_message -> Nullable<Text>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::SharingSettingEnum;

    teams (id) {
        id -> Uuid,
        name -> Text,
        organization_id -> Uuid,
        sharing_setting -> SharingSettingEnum,
        edit_sql -> Bool,
        upload_csv -> Bool,
        export_assets -> Bool,
        email_slack_enabled -> Bool,
        created_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::TeamRoleEnum;

    teams_to_users (team_id, user_id) {
        team_id -> Uuid,
        user_id -> Uuid,
        role -> TeamRoleEnum,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    terms (id) {
        id -> Uuid,
        name -> Text,
        definition -> Nullable<Text>,
        sql_snippet -> Nullable<Text>,
        organization_id -> Uuid,
        created_by -> Uuid,
        updated_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    terms_to_datasets (term_id, dataset_id) {
        term_id -> Uuid,
        dataset_id -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    threads_deprecated (id) {
        id -> Uuid,
        created_by -> Uuid,
        updated_by -> Uuid,
        publicly_accessible -> Bool,
        publicly_enabled_by -> Nullable<Uuid>,
        public_expiry_date -> Nullable<Timestamptz>,
        password_secret_id -> Nullable<Uuid>,
        state_message_id -> Nullable<Uuid>,
        parent_thread_id -> Nullable<Uuid>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        organization_id -> Uuid,
    }
}

diesel::table! {
    threads_to_dashboards (thread_id, dashboard_id) {
        thread_id -> Uuid,
        dashboard_id -> Uuid,
        added_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::AssetTypeEnum;

    user_favorites (user_id, asset_id, asset_type) {
        user_id -> Uuid,
        asset_id -> Uuid,
        asset_type -> AssetTypeEnum,
        order_index -> Int4,
        created_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    users (id) {
        id -> Uuid,
        email -> Text,
        name -> Nullable<Text>,
        config -> Jsonb,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        attributes -> Jsonb,
        avatar_url -> Nullable<Text>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::UserOrganizationRoleEnum;
    use super::sql_types::SharingSettingEnum;
    use super::sql_types::UserOrganizationStatusEnum;

    users_to_organizations (user_id, organization_id) {
        user_id -> Uuid,
        organization_id -> Uuid,
        role -> UserOrganizationRoleEnum,
        sharing_setting -> SharingSettingEnum,
        edit_sql -> Bool,
        upload_csv -> Bool,
        export_assets -> Bool,
        email_slack_enabled -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
        created_by -> Uuid,
        updated_by -> Uuid,
        deleted_by -> Nullable<Uuid>,
        status -> UserOrganizationStatusEnum,
    }
}

diesel::joinable!(api_keys -> organizations (organization_id));
diesel::joinable!(api_keys -> users (owner_id));
diesel::joinable!(chats -> organizations (organization_id));
diesel::joinable!(collections -> organizations (organization_id));
diesel::joinable!(dashboard_versions -> dashboards (dashboard_id));
diesel::joinable!(dashboards -> organizations (organization_id));
diesel::joinable!(data_sources -> organizations (organization_id));
diesel::joinable!(dataset_groups -> organizations (organization_id));
diesel::joinable!(dataset_groups_permissions -> dataset_groups (dataset_group_id));
diesel::joinable!(dataset_groups_permissions -> organizations (organization_id));
diesel::joinable!(dataset_permissions -> datasets (dataset_id));
diesel::joinable!(dataset_permissions -> organizations (organization_id));
diesel::joinable!(datasets -> data_sources (data_source_id));
diesel::joinable!(datasets -> organizations (organization_id));
diesel::joinable!(datasets_to_dataset_groups -> dataset_groups (dataset_group_id));
diesel::joinable!(datasets_to_dataset_groups -> datasets (dataset_id));
diesel::joinable!(datasets_to_permission_groups -> datasets (dataset_id));
diesel::joinable!(datasets_to_permission_groups -> permission_groups (permission_group_id));
diesel::joinable!(messages -> chats (chat_id));
diesel::joinable!(messages -> users (created_by));
diesel::joinable!(messages_deprecated -> datasets (dataset_id));
diesel::joinable!(messages_to_files -> messages (message_id));
diesel::joinable!(metric_files -> data_sources (data_source_id));
diesel::joinable!(metric_files_to_dashboard_files -> dashboard_files (dashboard_file_id));
diesel::joinable!(metric_files_to_dashboard_files -> metric_files (metric_file_id));
diesel::joinable!(metric_files_to_dashboard_files -> users (created_by));
diesel::joinable!(metric_files_to_datasets -> datasets (dataset_id));
diesel::joinable!(metric_files_to_datasets -> metric_files (metric_file_id));
diesel::joinable!(permission_groups -> organizations (organization_id));
diesel::joinable!(permission_groups_to_users -> permission_groups (permission_group_id));
diesel::joinable!(permission_groups_to_users -> users (user_id));
diesel::joinable!(stored_values_sync_jobs -> data_sources (data_source_id));
diesel::joinable!(teams -> organizations (organization_id));
diesel::joinable!(teams -> users (created_by));
diesel::joinable!(teams_to_users -> teams (team_id));
diesel::joinable!(teams_to_users -> users (user_id));
diesel::joinable!(terms -> organizations (organization_id));
diesel::joinable!(terms_to_datasets -> datasets (dataset_id));
diesel::joinable!(terms_to_datasets -> terms (term_id));
diesel::joinable!(threads_deprecated -> organizations (organization_id));
diesel::joinable!(threads_to_dashboards -> dashboards (dashboard_id));
diesel::joinable!(threads_to_dashboards -> threads_deprecated (thread_id));
diesel::joinable!(threads_to_dashboards -> users (added_by));
diesel::joinable!(user_favorites -> users (user_id));
diesel::joinable!(users_to_organizations -> organizations (organization_id));

diesel::allow_tables_to_appear_in_same_query!(
    api_keys,
    asset_permissions,
    chats,
    collections,
    collections_to_assets,
    dashboard_files,
    dashboard_versions,
    dashboards,
    data_sources,
    dataset_columns,
    dataset_groups,
    dataset_groups_permissions,
    dataset_permissions,
    datasets,
    datasets_to_dataset_groups,
    datasets_to_permission_groups,
    entity_relationship,
    messages,
    messages_deprecated,
    messages_to_files,
    metric_files,
    metric_files_to_dashboard_files,
    metric_files_to_datasets,
    organizations,
    report_files,
    permission_groups,
    permission_groups_to_identities,
    permission_groups_to_users,
    sql_evaluations,
    stored_values_sync_jobs,
    teams,
    teams_to_users,
    terms,
    terms_to_datasets,
    threads_deprecated,
    threads_to_dashboards,
    user_favorites,
    users,
    users_to_organizations,
);
