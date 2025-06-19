-- -- Your SQL goes here
create trigger "create_collection_embedding_webhook"
after
insert
    or
update
    of "name" on "public"."collections" for each row execute function "supabase_functions"."http_request"(
        'http://host.docker.internal:3001/api/v1/webhooks/embeddings',
        'POST',
        '{"Content-Type":"application/json", "Authorization":"Bearer buster-wh-token"}',
        '{}',
        '5000'
    );

create trigger "create_message_embedding_webhook"
after
insert
    or
update
    of "title" on "public"."messages" for each row
    when (
        NEW.title is not null
        and NEW.summary_question is not null
        and NEW.code is not null
    ) execute function "supabase_functions"."http_request"(
        'http://host.docker.internal:3001/api/v1/webhooks/embeddings',
        'POST',
        '{"Content-Type":"application/json", "Authorization":"Bearer buster-wh-token"}',
        '{}',
        '5000'
    );

create trigger "create_dashboard_embedding_webhook"
after
insert
    or
update
    of "name" on "public"."dashboards" for each row execute function "supabase_functions"."http_request"(
        'http://host.docker.internal:3001/api/v1/webhooks/embeddings',
        'POST',
        '{"Content-Type":"application/json", "Authorization":"Bearer buster-wh-token"}',
        '{}',
        '5000'
    );

create trigger "create_dataset_embedding_webhook"
after
insert
    or
update
    of "name" on "public"."datasets" for each row execute function "supabase_functions"."http_request"(
        'http://host.docker.internal:3001/api/v1/webhooks/embeddings',
        'POST',
        '{"Content-Type":"application/json", "Authorization":"Bearer buster-wh-token"}',
        '{}',
        '5000'
    );

create trigger "create_permission_group_embedding_webhook"
after
insert
    or
update
    of "name" on "public"."permission_groups" for each row execute function "supabase_functions"."http_request"(
        'http://host.docker.internal:3001/api/v1/webhooks/embeddings',
        'POST',
        '{"Content-Type":"application/json", "Authorization":"Bearer buster-wh-token"}',
        '{}',
        '5000'
    );

create trigger "create_team_embedding_webhook"
after
insert
    or
update
    of "name" on "public"."teams" for each row execute function "supabase_functions"."http_request"(
        'http://host.docker.internal:3001/api/v1/webhooks/embeddings',
        'POST',
        '{"Content-Type":"application/json", "Authorization":"Bearer buster-wh-token"}',
        '{}',
        '5000'
    );

create trigger "create_data_source_embedding_webhook"
after
insert
    or
update
    of "name" on "public"."data_sources" for each row execute function "supabase_functions"."http_request"(
        'http://host.docker.internal:3001/api/v1/webhooks/embeddings',
        'POST',
        '{"Content-Type":"application/json", "Authorization":"Bearer buster-wh-token"}',
        '{}',
        '5000'
    );

create trigger "create_term_embedding_webhook"
after
insert
    or
update
    of "name" on "public"."terms" for each row execute function "supabase_functions"."http_request"(
        'http://host.docker.internal:3001/api/v1/webhooks/embeddings',
        'POST',
        '{"Content-Type":"application/json", "Authorization":"Bearer buster-wh-token"}',
        '{}',
        '5000'
    );