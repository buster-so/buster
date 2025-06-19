{{ config(
    materialized = "table",
    tags = ["test", "exclude_me", "development"]
) }}

SELECT 
    1 as id,
    'test' as name,
    current_timestamp() as created_at 