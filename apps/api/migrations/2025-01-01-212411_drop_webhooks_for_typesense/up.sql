-- Your SQL goes here
drop trigger if exists "create_collection_embedding_webhook" on "public"."collections";
drop trigger if exists "create_message_embedding_webhook" on "public"."messages";
drop trigger if exists "create_dashboard_embedding_webhook" on "public"."dashboards";
drop trigger if exists "create_dataset_embedding_webhook" on "public"."datasets";
drop trigger if exists "create_permission_group_embedding_webhook" on "public"."permission_groups";
drop trigger if exists "create_team_embedding_webhook" on "public"."teams";
drop trigger if exists "create_data_source_embedding_webhook" on "public"."data_sources";
drop trigger if exists "create_term_embedding_webhook" on "public"."terms";
