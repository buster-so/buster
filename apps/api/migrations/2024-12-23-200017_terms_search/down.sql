-- This file should undo anything in `up.sql`
drop index if exists terms_search_embedding_idx;
drop index if exists terms_search_fts_idx;
drop index if exists terms_search_term_id_organization_id_idx;
drop table if exists terms_search;
drop extension if exists vector;
