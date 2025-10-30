-- Migration: Vault Credentials Schema Update
-- This migration updates vault credentials to ensure consistency across all layers (web → API → database → adapters)
--
-- Changes:
-- 1. BigQuery: credentials_json → service_account_key, default_project_id → project_id, default_dataset_id → default_dataset
-- 2. SQL Server: server → host
-- 3. Snowflake: Add auth_method field (defaults to 'password' for existing credentials)
-- 4. Safety Net: database → default_database (for all database types)
-- 5. Safety Net: schema → default_schema (for all database types that support schemas)
-- 6. Normalize data_sources.secret_id to use secret.id (UUID) instead of secret.name
--
-- Note: Safety net migrations preserve the original field as an alias for backward compatibility
-- This migration is idempotent and can be safely run multiple times.

DO $$
DECLARE
  secret_record RECORD;
  credentials_json JSONB;
  updated_json JSONB;
  changed BOOLEAN;
  total_processed INTEGER := 0;
  total_updated INTEGER := 0;
  secret_name_to_id_map JSONB := '{}';
  ds_record RECORD;
  correct_secret_id UUID;
  ds_updated INTEGER := 0;
BEGIN
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║        Vault Credentials Migration                            ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Starting vault credentials migration...';
  RAISE NOTICE '';

  -- ============================================================================
  -- PHASE 1: Migrate vault secrets to new credential format
  -- ============================================================================
  RAISE NOTICE '📥 Phase 1: Migrating vault secrets...';
  RAISE NOTICE '';

  -- Build secret name → id mapping for Phase 2
  FOR secret_record IN
    SELECT id, name
    FROM vault.secrets
    WHERE name IS NOT NULL
  LOOP
    secret_name_to_id_map := jsonb_set(
      secret_name_to_id_map,
      ARRAY[secret_record.name],
      to_jsonb(secret_record.id::text)
    );
  END LOOP;

  -- Process each secret
  FOR secret_record IN
    SELECT
      s.id,
      s.name,
      s.description,
      ds.decrypted_secret,
      s.key_id,
      s.nonce
    FROM vault.secrets s
    CROSS JOIN LATERAL (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE id = s.id
    ) ds
    ORDER BY s.created_at DESC
  LOOP
    total_processed := total_processed + 1;
    changed := FALSE;

    BEGIN
      -- Parse the secret as JSON
      credentials_json := secret_record.decrypted_secret::jsonb;

      -- Skip if no type field (not a data source credential)
      IF NOT (credentials_json ? 'type') THEN
        RAISE NOTICE '[%] Skipped: % - No type field (not a data source credential)',
          total_processed,
          COALESCE(secret_record.name, secret_record.id::text);
        CONTINUE;
      END IF;

      updated_json := credentials_json;

      -- Transform BigQuery credentials
      IF credentials_json->>'type' = 'bigquery' THEN
        -- credentials_json → service_account_key
        IF credentials_json ? 'credentials_json' AND NOT (credentials_json ? 'service_account_key') THEN
          updated_json := jsonb_set(
            updated_json,
            '{service_account_key}',
            credentials_json->'credentials_json'
          );
          updated_json := updated_json - 'credentials_json';
          changed := TRUE;
        END IF;

        -- default_project_id → project_id
        IF credentials_json ? 'default_project_id' AND NOT (credentials_json ? 'project_id') THEN
          updated_json := jsonb_set(
            updated_json,
            '{project_id}',
            credentials_json->'default_project_id'
          );
          updated_json := updated_json - 'default_project_id';
          changed := TRUE;
        END IF;

        -- default_dataset_id → default_dataset
        IF credentials_json ? 'default_dataset_id' AND NOT (credentials_json ? 'default_dataset') THEN
          updated_json := jsonb_set(
            updated_json,
            '{default_dataset}',
            credentials_json->'default_dataset_id'
          );
          updated_json := updated_json - 'default_dataset_id';
          changed := TRUE;
        END IF;
      END IF;

      -- Transform SQL Server credentials
      IF credentials_json->>'type' = 'sqlserver' THEN
        -- server → host
        IF credentials_json ? 'server' AND NOT (credentials_json ? 'host') THEN
          updated_json := jsonb_set(
            updated_json,
            '{host}',
            credentials_json->'server'
          );
          updated_json := updated_json - 'server';
          changed := TRUE;
        END IF;
      END IF;

      -- ========================================================================
      -- Transform Snowflake credentials: Add auth_method field
      -- ========================================================================
      IF credentials_json->>'type' = 'snowflake' THEN
        -- Add auth_method: 'password' if not present
        IF NOT (credentials_json ? 'auth_method') THEN
          -- Validate this is a password-based credential
          IF credentials_json ? 'password' THEN
            updated_json := jsonb_set(
              updated_json,
              '{auth_method}',
              '"password"'::jsonb
            );
            changed := TRUE;
          ELSE
            RAISE WARNING '[%] Snowflake credential % has no password field - skipping auth_method migration',
              total_processed,
              COALESCE(secret_record.name, secret_record.id::text);
          END IF;
        END IF;
      END IF;

      -- ========================================================================
      -- SAFETY NET: Migrate database → default_database for ALL types
      -- ========================================================================
      IF credentials_json ? 'database'
         AND credentials_json->'database' IS NOT NULL
         AND (NOT (credentials_json ? 'default_database') OR credentials_json->'default_database' IS NULL) THEN
        updated_json := jsonb_set(
          updated_json,
          '{default_database}',
          credentials_json->'database'
        );
        -- Keep 'database' as an alias for compatibility
        changed := TRUE;
      END IF;

      -- ========================================================================
      -- SAFETY NET: Migrate schema → default_schema for ALL types
      -- ========================================================================
      IF credentials_json ? 'schema'
         AND credentials_json->'schema' IS NOT NULL
         AND (NOT (credentials_json ? 'default_schema') OR credentials_json->'default_schema' IS NULL) THEN
        updated_json := jsonb_set(
          updated_json,
          '{default_schema}',
          credentials_json->'schema'
        );
        -- Keep 'schema' as an alias for compatibility
        changed := TRUE;
      END IF;

      -- Update the secret if changes were made
      IF changed THEN
        -- Use vault.update_secret() function for proper encryption
        PERFORM vault.update_secret(
          secret_record.id,
          updated_json::text,
          secret_record.name,
          secret_record.description
        );

        total_updated := total_updated + 1;
        RAISE NOTICE '[%] ✅ Updated: % (type: %)',
          total_processed,
          COALESCE(secret_record.name, secret_record.id::text),
          credentials_json->>'type';
      ELSE
        RAISE NOTICE '[%] ✓ Already correct: % (type: %)',
          total_processed,
          COALESCE(secret_record.name, secret_record.id::text),
          credentials_json->>'type';
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '[%] ❌ Error processing secret %: %',
        total_processed,
        COALESCE(secret_record.name, secret_record.id::text),
        SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '📊 Phase 1 Summary:';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total processed: %', total_processed;
  RAISE NOTICE 'Updated: %', total_updated;
  RAISE NOTICE 'Skipped: %', total_processed - total_updated;
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- ============================================================================
  -- PHASE 2: Normalize data source secret IDs (name → UUID)
  -- ============================================================================
  RAISE NOTICE '🔗 Phase 2: Normalizing data source secret IDs...';
  RAISE NOTICE '';

  total_processed := 0;

  -- Check each data source
  FOR ds_record IN
    SELECT id, name, type, secret_id
    FROM data_sources
    WHERE deleted_at IS NULL
  LOOP
    total_processed := total_processed + 1;

    -- Check if secret_id is actually a secret name (exists in our mapping)
    -- Cast secret_id to text for JSONB key lookup
    IF secret_name_to_id_map ? ds_record.secret_id::text THEN
      correct_secret_id := (secret_name_to_id_map->>ds_record.secret_id::text)::uuid;

      UPDATE data_sources
      SET
        secret_id = correct_secret_id,
        updated_at = now()
      WHERE id = ds_record.id;

      ds_updated := ds_updated + 1;
      RAISE NOTICE '[%] ✅ Updated data source "%" - secret_id: % → %',
        total_processed,
        ds_record.name,
        ds_record.secret_id,
        correct_secret_id;
    ELSE
      RAISE NOTICE '[%] ✓ Already correct: "%" - using UUID: %',
        total_processed,
        ds_record.name,
        ds_record.secret_id;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '📊 Phase 2 Summary:';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total processed: %', total_processed;
  RAISE NOTICE 'Updated: %', ds_updated;
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '';

END $$;
