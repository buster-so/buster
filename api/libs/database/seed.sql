--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 16.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000000', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'authenticated', 'authenticated', 'chad@buster.so', '$2a$06$BKy/23Yp58fItuTD0aKWluB2ayXyww8AeXNQ0KHgh9TeRxJ/tbmaC', '2025-03-04 18:42:05.801697+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-03-04 18:42:05.801697+00', '2025-03-04 18:42:05.801697+00', NULL, NULL, '', '', NULL, DEFAULT, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000000', '1fe85021-e799-471b-8837-953e9ae06e4c', 'authenticated', 'authenticated', 'blake@buster.so', '$2a$06$TGfhnVxsa/Iy/rHmPnjiTuCMkui64yaAOEJl3qqaplGDrbUioCfPS', '2025-03-04 18:42:05.801697+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-03-04 18:42:05.801697+00', '2025-03-04 18:42:05.801697+00', NULL, NULL, '', '', NULL, DEFAULT, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000000', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', 'authenticated', 'authenticated', 'nate@buster.so', '$2a$06$Qy7COradxcriaW2vMkfFce1GNSvt3NVq/7LI0bPid.rk.gMZ20Thi', '2025-03-04 18:42:05.801697+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-03-04 18:42:05.801697+00', '2025-03-04 18:42:05.801697+00', NULL, NULL, '', '', NULL, DEFAULT, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.identities VALUES ('c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '{"sub": "c2dd64cd-f7f3-4884-bc91-d46ae431901e"}', 'email', '2025-03-04 18:42:05.81425+00', '2025-03-04 18:42:05.81425+00', '2025-03-04 18:42:05.81425+00', DEFAULT, 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
INSERT INTO auth.identities VALUES ('1fe85021-e799-471b-8837-953e9ae06e4c', '1fe85021-e799-471b-8837-953e9ae06e4c', '{"sub": "1fe85021-e799-471b-8837-953e9ae06e4c"}', 'email', '2025-03-04 18:42:05.81425+00', '2025-03-04 18:42:05.81425+00', '2025-03-04 18:42:05.81425+00', DEFAULT, '1fe85021-e799-471b-8837-953e9ae06e4c');
INSERT INTO auth.identities VALUES ('6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '{"sub": "6840fa04-c0d7-4e0e-8d3d-ea9190d93874"}', 'email', '2025-03-04 18:42:05.81425+00', '2025-03-04 18:42:05.81425+00', '2025-03-04 18:42:05.81425+00', DEFAULT, '6840fa04-c0d7-4e0e-8d3d-ea9190d93874');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.schema_migrations VALUES ('20171026211738');
INSERT INTO auth.schema_migrations VALUES ('20171026211808');
INSERT INTO auth.schema_migrations VALUES ('20171026211834');
INSERT INTO auth.schema_migrations VALUES ('20180103212743');
INSERT INTO auth.schema_migrations VALUES ('20180108183307');
INSERT INTO auth.schema_migrations VALUES ('20180119214651');
INSERT INTO auth.schema_migrations VALUES ('20180125194653');
INSERT INTO auth.schema_migrations VALUES ('00');
INSERT INTO auth.schema_migrations VALUES ('20210710035447');
INSERT INTO auth.schema_migrations VALUES ('20210722035447');
INSERT INTO auth.schema_migrations VALUES ('20210730183235');
INSERT INTO auth.schema_migrations VALUES ('20210909172000');
INSERT INTO auth.schema_migrations VALUES ('20210927181326');
INSERT INTO auth.schema_migrations VALUES ('20211122151130');
INSERT INTO auth.schema_migrations VALUES ('20211124214934');
INSERT INTO auth.schema_migrations VALUES ('20211202183645');
INSERT INTO auth.schema_migrations VALUES ('20220114185221');
INSERT INTO auth.schema_migrations VALUES ('20220114185340');
INSERT INTO auth.schema_migrations VALUES ('20220224000811');
INSERT INTO auth.schema_migrations VALUES ('20220323170000');
INSERT INTO auth.schema_migrations VALUES ('20220429102000');
INSERT INTO auth.schema_migrations VALUES ('20220531120530');
INSERT INTO auth.schema_migrations VALUES ('20220614074223');
INSERT INTO auth.schema_migrations VALUES ('20220811173540');
INSERT INTO auth.schema_migrations VALUES ('20221003041349');
INSERT INTO auth.schema_migrations VALUES ('20221003041400');
INSERT INTO auth.schema_migrations VALUES ('20221011041400');
INSERT INTO auth.schema_migrations VALUES ('20221020193600');
INSERT INTO auth.schema_migrations VALUES ('20221021073300');
INSERT INTO auth.schema_migrations VALUES ('20221021082433');
INSERT INTO auth.schema_migrations VALUES ('20221027105023');
INSERT INTO auth.schema_migrations VALUES ('20221114143122');
INSERT INTO auth.schema_migrations VALUES ('20221114143410');
INSERT INTO auth.schema_migrations VALUES ('20221125140132');
INSERT INTO auth.schema_migrations VALUES ('20221208132122');
INSERT INTO auth.schema_migrations VALUES ('20221215195500');
INSERT INTO auth.schema_migrations VALUES ('20221215195800');
INSERT INTO auth.schema_migrations VALUES ('20221215195900');
INSERT INTO auth.schema_migrations VALUES ('20230116124310');
INSERT INTO auth.schema_migrations VALUES ('20230116124412');
INSERT INTO auth.schema_migrations VALUES ('20230131181311');
INSERT INTO auth.schema_migrations VALUES ('20230322519590');
INSERT INTO auth.schema_migrations VALUES ('20230402418590');
INSERT INTO auth.schema_migrations VALUES ('20230411005111');
INSERT INTO auth.schema_migrations VALUES ('20230508135423');
INSERT INTO auth.schema_migrations VALUES ('20230523124323');
INSERT INTO auth.schema_migrations VALUES ('20230818113222');
INSERT INTO auth.schema_migrations VALUES ('20230914180801');
INSERT INTO auth.schema_migrations VALUES ('20231027141322');
INSERT INTO auth.schema_migrations VALUES ('20231114161723');
INSERT INTO auth.schema_migrations VALUES ('20231117164230');
INSERT INTO auth.schema_migrations VALUES ('20240115144230');
INSERT INTO auth.schema_migrations VALUES ('20240214120130');
INSERT INTO auth.schema_migrations VALUES ('20240306115329');
INSERT INTO auth.schema_migrations VALUES ('20240314092811');
INSERT INTO auth.schema_migrations VALUES ('20240427152123');
INSERT INTO auth.schema_migrations VALUES ('20240612123726');
INSERT INTO auth.schema_migrations VALUES ('20240729123726');
INSERT INTO auth.schema_migrations VALUES ('20240802193726');
INSERT INTO auth.schema_migrations VALUES ('20240806073726');
INSERT INTO auth.schema_migrations VALUES ('20241009103726');


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: job; Type: TABLE DATA; Schema: cron; Owner: supabase_admin
--

INSERT INTO cron.job VALUES (1, '0 3 * * *', 'SELECT delete_old_anon_users()', 'localhost', 5432, 'postgres', 'postgres', true, 'delete_old_anon_users_job');


--
-- Data for Name: job_run_details; Type: TABLE DATA; Schema: cron; Owner: supabase_admin
--



--
-- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: supabase_admin
--

INSERT INTO pgsodium.key VALUES ('24ad8983-035e-4eb2-bc4a-40a348a11d0b', 'valid', '2025-03-04 18:42:05.815044+00', NULL, 'aead-det', 1, '\x7067736f6469756d', NULL, '', NULL, NULL, NULL, NULL, NULL);
INSERT INTO pgsodium.key VALUES ('b7bb1425-9c8f-46e9-88c3-89eb03f109ab', 'valid', '2025-03-04 18:43:59.677122+00', NULL, 'aead-det', 2, '\x7067736f6469756d', NULL, '', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.organizations VALUES ('bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'Buster', 'buster.so', '2024-11-05 15:41:13.864677+00', '2024-11-05 15:41:13.8647+00', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES ('c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'chad@buster.so', 'Chad', '{}', '2024-11-05 15:41:13.939119+00', '2024-11-05 15:41:13.939119+00', '{"user_id": "c2dd64cd-f7f3-4884-bc91-d46ae431901e", "user_email": "chad@buster.so", "organization_id": "bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce", "organization_role": "workspace_admin"}');
INSERT INTO public.users VALUES ('1fe85021-e799-471b-8837-953e9ae06e4c', 'blake@buster.so', 'Blake', '{}', '2024-11-05 15:41:13.946991+00', '2024-11-05 15:41:13.946991+00', '{"user_id": "1fe85021-e799-471b-8837-953e9ae06e4c", "user_email": "blake@buster.so", "organization_id": "bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce", "organization_role": "querier"}');
INSERT INTO public.users VALUES ('6840fa04-c0d7-4e0e-8d3d-ea9190d93874', 'nate@buster.so', 'Nate', '{}', '2024-11-05 15:41:13.953321+00', '2024-11-05 15:41:13.953321+00', '{"user_id": "6840fa04-c0d7-4e0e-8d3d-ea9190d93874", "user_email": "nate@buster.so", "organization_id": "bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce", "organization_role": "data_admin"}');


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.api_keys VALUES ('d596bfa2-8efb-4583-a46c-939c4eae96c7', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE4OTg3OTM3NzIsImF1ZCI6ImFwaSIsInN1YiI6ImMyZGQ2NGNkLWY3ZjMtNDg4NC1iYzkxLWQ0NmFlNDMxOTAxZSJ9.beASQcaww_gcW9mwnqj-7GyYaVW5xQBEsju_qUZ-PlE', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', '2025-03-04 18:42:52.360993+00', '2025-03-04 18:42:52.360994+00', NULL);


--
-- Data for Name: asset_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: asset_search; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: collections; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: collections_to_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: dashboard_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: dashboards; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: dashboard_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: data_sources; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.data_sources VALUES ('cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'adventure_works', 'postgres', '211887e9-e359-4d10-bcad-8abd2d5d10a7', 'notStarted', NULL, 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:43:59.670034+00', '2025-03-04 18:43:59.670039+00', NULL, 'dev');


--
-- Data for Name: dataset_columns; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.dataset_columns VALUES ('e8345d76-0ab3-4407-b91c-46ae3321431f', 'f4298ca8-9e61-4e88-b958-59975a06bcec', 'transaction_date', 'timestamp without time zone', 'The date and time when the transaction occurred.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'transaction_date');
INSERT INTO public.dataset_columns VALUES ('abc42be0-efe5-4efa-8ebf-e2af61dd7746', 'f4298ca8-9e61-4e88-b958-59975a06bcec', 'transaction_type', 'character', 'The type or classification of the transaction.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character', 'transaction_type');
INSERT INTO public.dataset_columns VALUES ('af5d6489-e046-431c-a7fd-dec13a13afde', 'f4298ca8-9e61-4e88-b958-59975a06bcec', 'modified_date', 'timestamp without time zone', 'Timestamp indicating the last modification date of the record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('bae40987-7089-465a-a121-0fb1ab08d702', 'f4298ca8-9e61-4e88-b958-59975a06bcec', 'transaction_history_archive_key', 'integer', 'Unique key identifier for archived transaction history records.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'transaction_history_archive_key');
INSERT INTO public.dataset_columns VALUES ('13331ac7-241a-41ef-829c-9c7239936c6c', 'f4298ca8-9e61-4e88-b958-59975a06bcec', 'transaction_id', 'integer', 'Unique identifier for the transaction.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'transaction_id');
INSERT INTO public.dataset_columns VALUES ('8b5c7be6-bb1f-4626-97b6-8142b7db2f29', 'f4298ca8-9e61-4e88-b958-59975a06bcec', 'product_id', 'integer', 'Identifier for the product involved in the transaction.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_id');
INSERT INTO public.dataset_columns VALUES ('c8185905-05a2-4d55-aa97-8f15fba5c5fe', 'f4298ca8-9e61-4e88-b958-59975a06bcec', 'reference_order_id', 'integer', 'Identifier for the associated order.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'reference_order_id');
INSERT INTO public.dataset_columns VALUES ('860fbd9e-9165-47ca-9ef7-53ae4334e35b', 'f4298ca8-9e61-4e88-b958-59975a06bcec', 'reference_order_line_id', 'integer', 'Identifier for the specific order line in the associated order.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'reference_order_line_id');
INSERT INTO public.dataset_columns VALUES ('7a74e8c4-8c8b-4dc4-bec3-5cf27dae949a', 'f4298ca8-9e61-4e88-b958-59975a06bcec', 'quantity', 'integer', 'The count of products involved in the transaction.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'quantity');
INSERT INTO public.dataset_columns VALUES ('1a842dc2-344b-415b-b245-1ada87b6e578', 'f4298ca8-9e61-4e88-b958-59975a06bcec', 'actual_cost', 'numeric', 'The actual cost incurred in the transaction.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'actual_cost');
INSERT INTO public.dataset_columns VALUES ('7407fb99-ac88-4d00-9003-65db7ac001d3', '5ff9b5f5-096b-48a6-b217-a0fe520f5962', 'name', 'character varying', 'The name of the sales reason entity.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('68c4179a-9a7e-4d97-bfd6-b1103d601b27', '5ff9b5f5-096b-48a6-b217-a0fe520f5962', 'reason_type', 'character varying', 'The classification type indicating the nature of the sales reason.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'reason_type');
INSERT INTO public.dataset_columns VALUES ('39ed8c32-8516-409f-a927-5d8c908df070', '5ff9b5f5-096b-48a6-b217-a0fe520f5962', 'modified_date', 'timestamp without time zone', 'The date and time when the sales reason entity was last modified.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('12772fb0-e88e-4341-aac8-55480a000a91', '5ff9b5f5-096b-48a6-b217-a0fe520f5962', 'sales_reason_key', 'integer', 'The key identifier for aggregating sales reason data.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_reason_key');
INSERT INTO public.dataset_columns VALUES ('31f37c74-746a-4784-9ae3-020828b17cfd', '5ff9b5f5-096b-48a6-b217-a0fe520f5962', 'sales_reason_id', 'integer', 'The unique identifier for sales reason instances used in aggregation.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_reason_id');
INSERT INTO public.dataset_columns VALUES ('f30875c2-8439-4f57-bd6a-e689f812b2d2', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'name', 'character varying', 'The name of the product', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('01b9283b-a349-4fdf-9cc2-34d7f4f768f4', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'product_number', 'character varying', 'The unique product identification number', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'product_number');
INSERT INTO public.dataset_columns VALUES ('7314121a-b182-4f0c-954f-be1bf29b8351', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'color', 'character varying', 'The color of the product', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'color');
INSERT INTO public.dataset_columns VALUES ('8b3e61ce-5566-42c2-81bc-b450136ac646', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'product_category', 'character varying', 'The main category to which the product belongs', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'product_category');
INSERT INTO public.dataset_columns VALUES ('e098fd2f-a310-4211-8b8d-7b3485bd92ef', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'product_subcategory', 'character varying', 'The subcategory classification for the product', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'product_subcategory');
INSERT INTO public.dataset_columns VALUES ('fc172317-07b3-41f7-9951-32b9a9b8119b', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'product_model', 'character varying', 'The model identifier for the product', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'product_model');
INSERT INTO public.dataset_columns VALUES ('48e7e5d5-d7cf-4931-a2cd-2566c87192bd', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'sell_start_date', 'timestamp without time zone', 'The date when the product became available for sale', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'sell_start_date');
INSERT INTO public.dataset_columns VALUES ('c3a756aa-330b-4bc8-a382-d889f329cf35', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'sell_end_date', 'timestamp without time zone', 'The date when the product was discontinued from sale', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'sell_end_date');
INSERT INTO public.dataset_columns VALUES ('e1caa6db-0e96-4c85-9e17-9e877d4eb4f6', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'modified_date', 'timestamp without time zone', 'The date when the product details were last updated', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('ca5e740a-48fd-4f50-9e95-f7aca8653ad6', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'segment_product_value', 'text', 'Descriptive segment that categorizes product value', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'text', 'segment_product_value');
INSERT INTO public.dataset_columns VALUES ('c37c0d76-b6a2-4208-a0df-9313e862ae90', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'product_key', 'integer', 'A unique key used to identify the product record', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_key');
INSERT INTO public.dataset_columns VALUES ('ffd4ba7e-0ec7-422e-82dd-9cb70e9c1828', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'product_id', 'integer', 'A unique numeric identifier for the product', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_id');
INSERT INTO public.dataset_columns VALUES ('cd687df4-a54b-4f4c-b04b-15bfc9ad129e', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'standard_cost', 'numeric', 'The standard cost to produce or procure the product', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'standard_cost');
INSERT INTO public.dataset_columns VALUES ('964fa742-1cb9-4c2f-ba4f-01ae7e53a7a3', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'list_price', 'numeric', 'The retail list price of the product', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'list_price');
INSERT INTO public.dataset_columns VALUES ('fe34d2aa-f4cd-4f24-bcfe-19a58d08f124', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'current_list_price', 'numeric', 'The current effective retail price of the product', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'current_list_price');
INSERT INTO public.dataset_columns VALUES ('e676a414-ca6a-4f25-a0dd-bf0f1fb4a808', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'inventory_quantity', 'bigint', 'The total quantity available in inventory', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'bigint', 'inventory_quantity');
INSERT INTO public.dataset_columns VALUES ('e1b4e089-f66f-43d8-8992-d820652a6057', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'avg_rating', 'numeric', 'The average customer rating for the product', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'avg_rating');
INSERT INTO public.dataset_columns VALUES ('4a0ab691-8b59-4da6-a88b-1b3c56bca190', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'total_units_sold_last_12_months', 'bigint', 'Total number of product units sold in the last 12 months', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'bigint', 'total_units_sold_last_12_months');
INSERT INTO public.dataset_columns VALUES ('6adb500f-e804-426b-8b0d-6bb29a209c5c', 'e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'total_product_revenue_last_12_months', 'numeric', 'Total revenue generated by the product in the last 12 months', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'total_product_revenue_last_12_months');
INSERT INTO public.dataset_columns VALUES ('3ddbf246-eb0a-4214-9977-e873c2ae55d8', '222e07e9-5212-4a87-b8eb-4bd4f02cca62', 'name', 'character varying', 'The name of the phone number type.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('80094b43-1b80-4b51-85ff-fccce33f9ec6', '222e07e9-5212-4a87-b8eb-4bd4f02cca62', 'modified_date', 'timestamp without time zone', 'The date when the record was last modified.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('bf1ab355-c9ee-42bc-bd44-51c6ef8c2cd9', '222e07e9-5212-4a87-b8eb-4bd4f02cca62', 'phone_number_type_key', 'integer', 'A unique key identifier for the phone number type.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'phone_number_type_key');
INSERT INTO public.dataset_columns VALUES ('e28c8093-8b53-47a6-8fc2-0518f553bcea', '222e07e9-5212-4a87-b8eb-4bd4f02cca62', 'phone_number_type_id', 'integer', 'The identifier associated with the phone number type.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'phone_number_type_id');
INSERT INTO public.dataset_columns VALUES ('b48ded12-5499-4b18-b5df-3cd4cde70342', '40fc4d7f-0035-4597-9173-7b72a5e6bdde', 'currency_rate_date', 'timestamp without time zone', 'Date of the currency exchange rate. Represents the specific day the rate was recorded.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'currency_rate_date');
INSERT INTO public.dataset_columns VALUES ('03e15792-a90c-4248-ad7f-a3181fe57f8b', '40fc4d7f-0035-4597-9173-7b72a5e6bdde', 'from_currency_code', 'character', 'Currency code representing the source currency.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character', 'from_currency_code');
INSERT INTO public.dataset_columns VALUES ('590b6e4a-58d4-4f86-92c8-0db6cae280e6', '40fc4d7f-0035-4597-9173-7b72a5e6bdde', 'to_currency_code', 'character', 'Currency code representing the target currency.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character', 'to_currency_code');
INSERT INTO public.dataset_columns VALUES ('f26ea146-7e00-4655-9944-7cf6ebd3881e', '40fc4d7f-0035-4597-9173-7b72a5e6bdde', 'modified_date', 'timestamp without time zone', 'Timestamp of the last modification to the record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('bfe75a57-d07c-4e8c-9801-740fca280a9f', '40fc4d7f-0035-4597-9173-7b72a5e6bdde', 'currency_rate_key', 'integer', 'Unique key identifier for the currency rate record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'currency_rate_key');
INSERT INTO public.dataset_columns VALUES ('34bfc9d8-3189-41af-afcc-ed3275fc7bf3', '40fc4d7f-0035-4597-9173-7b72a5e6bdde', 'currency_rate_id', 'integer', 'Identifier for the currency rate.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'currency_rate_id');
INSERT INTO public.dataset_columns VALUES ('8bf5f70a-0cd1-43b6-81e8-eb92b3bc8ece', '40fc4d7f-0035-4597-9173-7b72a5e6bdde', 'average_rate', 'numeric', 'The average exchange rate calculated for the day.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'average_rate');
INSERT INTO public.dataset_columns VALUES ('e413e08d-0278-4de8-a206-4b4e98b8519e', '40fc4d7f-0035-4597-9173-7b72a5e6bdde', 'end_of_day_rate', 'numeric', 'The final exchange rate recorded at the end of the day.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'end_of_day_rate');
INSERT INTO public.dataset_columns VALUES ('30654a48-e870-4281-9dc2-dc69bf47bee0', '16a38e0e-5699-43a7-addf-1cbf8bafdea7', 'country_region_code', 'character varying', 'The unique code representing a country or region.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'country_region_code');
INSERT INTO public.dataset_columns VALUES ('0f18d439-ea49-400f-891b-3375f26fa2db', '16a38e0e-5699-43a7-addf-1cbf8bafdea7', 'name', 'character varying', 'The name of the country or region.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('0788f57b-cf4a-4b62-b96f-4bfd5060792c', '16a38e0e-5699-43a7-addf-1cbf8bafdea7', 'modified_date', 'timestamp without time zone', 'The date and time when the record was last updated.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('7b5cb419-a156-4f30-86bf-334c8014ef7c', '16a38e0e-5699-43a7-addf-1cbf8bafdea7', 'country_region_key', 'integer', 'Identifier key used for aggregating country or region data.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'country_region_key');
INSERT INTO public.dataset_columns VALUES ('19da9dce-c97f-4bc8-881f-99223a0ef348', 'eeb0ca19-e3cf-4d83-9761-f175a9fbbedc', 'country_region_code', 'character varying', 'Unique code representing the country and region.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'country_region_code');
INSERT INTO public.dataset_columns VALUES ('98ae148a-a8d2-4ad1-9639-6e44cf799552', 'eeb0ca19-e3cf-4d83-9761-f175a9fbbedc', 'currency_code', 'character', 'Currency identifier code corresponding to the country/region.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character', 'currency_code');
INSERT INTO public.dataset_columns VALUES ('c58818b0-ebc4-47fb-88ff-4190f612e9d9', 'eeb0ca19-e3cf-4d83-9761-f175a9fbbedc', 'modified_date', 'timestamp without time zone', 'Timestamp when the record was last modified.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('90117721-8fed-4a42-8a54-056be09dda44', 'eeb0ca19-e3cf-4d83-9761-f175a9fbbedc', 'bridge_country_region_currency_key', 'integer', 'Aggregated key linking country, region, and currency.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'bridge_country_region_currency_key');
INSERT INTO public.dataset_columns VALUES ('9b116461-476e-4951-acdf-aa6102dae4b9', 'bcab71b8-a432-4e8b-9b7f-9cca1709f9a4', 'rowguid', 'uuid', 'A unique identifier for each entity row, ensuring data integrity.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'uuid', 'rowguid');
INSERT INTO public.dataset_columns VALUES ('c112204d-7736-4a78-8f3f-bbd0a949fb97', 'bcab71b8-a432-4e8b-9b7f-9cca1709f9a4', 'modified_date', 'timestamp without time zone', 'The timestamp when the record was last updated, useful for tracking changes.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('b3730577-3aed-4eb3-b740-1034c71dca12', 'bcab71b8-a432-4e8b-9b7f-9cca1709f9a4', 'business_entity_key', 'integer', 'The cumulative sum of business entity keys, representing aggregated identifier data.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'business_entity_key');
INSERT INTO public.dataset_columns VALUES ('40166909-55b3-41e2-9735-a6e9b4ffecd7', 'bcab71b8-a432-4e8b-9b7f-9cca1709f9a4', 'business_entity_id', 'integer', 'The cumulative sum of business entity IDs, useful for summarizing entity counts.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'business_entity_id');
INSERT INTO public.dataset_columns VALUES ('aa71380f-f7dc-41f0-944a-6c6effd938aa', 'c4f322cc-ebe8-41d8-a929-d4723ec826b3', 'shopping_cart_id', 'character varying', 'Unique identifier for the shopping cart.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'shopping_cart_id');
INSERT INTO public.dataset_columns VALUES ('ddbed792-0e94-428a-87e9-0eb2b85f23d6', 'c4f322cc-ebe8-41d8-a929-d4723ec826b3', 'date_created', 'timestamp without time zone', 'Timestamp marking when the shopping cart item was created.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'date_created');
INSERT INTO public.dataset_columns VALUES ('b691d445-9e6a-49d9-8b5e-baebcc9089ca', 'c4f322cc-ebe8-41d8-a929-d4723ec826b3', 'modified_date', 'timestamp without time zone', 'Timestamp indicating the last time the shopping cart item was modified.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('941013fe-65d2-46a3-b9f8-a591d4fe5254', 'c4f322cc-ebe8-41d8-a929-d4723ec826b3', 'shopping_cart_item_key', 'integer', 'Summarizes unique keys of shopping cart items for aggregation purposes.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'shopping_cart_item_key');
INSERT INTO public.dataset_columns VALUES ('14b578a3-4a7b-46d2-aced-2fb3097e55cb', 'c4f322cc-ebe8-41d8-a929-d4723ec826b3', 'shopping_cart_item_id', 'integer', 'Aggregates the unique identifiers of each shopping cart item.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'shopping_cart_item_id');
INSERT INTO public.dataset_columns VALUES ('b8ed2bb6-f822-4921-bbfd-a9df8893cf52', 'c4f322cc-ebe8-41d8-a929-d4723ec826b3', 'quantity', 'integer', 'Total quantity of the product captured in the shopping cart item.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'quantity');
INSERT INTO public.dataset_columns VALUES ('93e2483d-2f61-4a15-9da9-74dd23013da3', 'c4f322cc-ebe8-41d8-a929-d4723ec826b3', 'product_id', 'integer', 'Aggregated identifier for the product associated with the shopping cart item.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_id');
INSERT INTO public.dataset_columns VALUES ('3aeb54b2-3369-4756-8f61-ea7782f04f24', 'cca26df0-c191-487a-a3fd-71496f96359f', 'assembly_name', 'character varying', 'Name of the assembly in the bill of materials record', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'assembly_name');
INSERT INTO public.dataset_columns VALUES ('9c5b8f2b-29c0-4dc7-b4aa-700f9ee3b8df', 'cca26df0-c191-487a-a3fd-71496f96359f', 'component_name', 'character varying', 'Name for the component included in the assembly', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'component_name');
INSERT INTO public.dataset_columns VALUES ('c424cdd3-dd85-45b8-9b13-c7e531a61e37', 'cca26df0-c191-487a-a3fd-71496f96359f', 'start_date', 'timestamp without time zone', 'The start date when the assembly component relationship becomes valid', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'start_date');
INSERT INTO public.dataset_columns VALUES ('51fd11e5-ee97-4547-a7b9-212a943d4df5', 'cca26df0-c191-487a-a3fd-71496f96359f', 'end_date', 'timestamp without time zone', 'The end date when the assembly component relationship expires', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'end_date');
INSERT INTO public.dataset_columns VALUES ('730f3aaa-eeca-4266-a6e8-fc924f3e1895', 'cca26df0-c191-487a-a3fd-71496f96359f', 'unit_measure_code', 'character', 'Code representing the unit of measure for component quantity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character', 'unit_measure_code');
INSERT INTO public.dataset_columns VALUES ('dbb47587-742d-40b2-93de-aa871638d08d', 'cca26df0-c191-487a-a3fd-71496f96359f', 'modified_date', 'timestamp without time zone', 'Timestamp indicating the last modification date of the record', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('4b5bf326-bd70-4f49-ae54-8ee7f8546abe', 'cca26df0-c191-487a-a3fd-71496f96359f', 'bom_key', 'integer', 'Unique key identifying the bill of materials record', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'bom_key');
INSERT INTO public.dataset_columns VALUES ('effe3f62-d19c-47c7-bffd-b0cb9dc254b0', 'cca26df0-c191-487a-a3fd-71496f96359f', 'bill_of_materials_id', 'integer', 'Identifier for the bill of materials entry', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'bill_of_materials_id');
INSERT INTO public.dataset_columns VALUES ('447d7cb0-ecba-4795-a606-36468217db43', 'cca26df0-c191-487a-a3fd-71496f96359f', 'fk_assembly', 'integer', 'Foreign key linking to the assembly entity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_assembly');
INSERT INTO public.dataset_columns VALUES ('c3b73e20-4e49-47fa-896e-a3e4c49070c3', 'cca26df0-c191-487a-a3fd-71496f96359f', 'fk_component', 'integer', 'Foreign key linking to the component entity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_component');
INSERT INTO public.dataset_columns VALUES ('c59df372-fe9e-4892-96d7-0199a3bc1624', 'cca26df0-c191-487a-a3fd-71496f96359f', 'bom_level', 'smallint', 'Level of the component within the assembly hierarchy', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'smallint', 'bom_level');
INSERT INTO public.dataset_columns VALUES ('51b740dc-afad-467a-9c86-d6450f2ce957', 'cca26df0-c191-487a-a3fd-71496f96359f', 'per_assembly_qty', 'numeric', 'Quantity of the component required per assembly', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'per_assembly_qty');
INSERT INTO public.dataset_columns VALUES ('ced2c326-cf14-47d2-beda-fd6ada1fd748', '5114cd6f-71b2-4843-8354-ddf0746ec22d', 'diagram', 'xml', 'XML representation of the diagram for the entity illustration', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'xml', 'diagram');
INSERT INTO public.dataset_columns VALUES ('1597b7da-2d13-41d6-963e-55df9c2c3598', '5114cd6f-71b2-4843-8354-ddf0746ec22d', 'modified_date', 'timestamp without time zone', 'Timestamp indicating when the entity illustration was last modified', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('69f7b58c-3d9c-458a-9cc7-d27b131681bf', '5114cd6f-71b2-4843-8354-ddf0746ec22d', 'illustration_key', 'integer', 'Unique key associated with the illustration for aggregate computations', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'illustration_key');
INSERT INTO public.dataset_columns VALUES ('d87ea94b-e302-4fdd-aba3-d1f4f35aba81', '5114cd6f-71b2-4843-8354-ddf0746ec22d', 'illustration_id', 'integer', 'Unique identifier used for the illustration', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'illustration_id');
INSERT INTO public.dataset_columns VALUES ('5ec6d3f1-739b-440c-bc40-66fd3e15fffe', '129a0d01-a139-471d-af2e-627ee136369c', 'document_node', 'character varying', 'Unique identifier for the document node', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'document_node');
INSERT INTO public.dataset_columns VALUES ('2f9d9837-265d-479c-9560-66419424118f', '129a0d01-a139-471d-af2e-627ee136369c', 'title', 'character varying', 'The title of the document', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'title');
INSERT INTO public.dataset_columns VALUES ('0ce44243-81c0-4c0e-92d5-2096ba2f7868', '129a0d01-a139-471d-af2e-627ee136369c', 'folder_flag', 'boolean', 'Indicates if the document is a folder', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'boolean', 'folder_flag');
INSERT INTO public.dataset_columns VALUES ('2460c247-f2e4-4a86-86aa-d880a4bbc699', '129a0d01-a139-471d-af2e-627ee136369c', 'file_name', 'character varying', 'Name of the file associated with the document', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'file_name');
INSERT INTO public.dataset_columns VALUES ('58f4ce6a-ff6e-4a1e-bdb1-eae8b6bc26d5', '129a0d01-a139-471d-af2e-627ee136369c', 'file_extension', 'character varying', 'File extension of the document', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'file_extension');
INSERT INTO public.dataset_columns VALUES ('e4e5af1d-2c87-4743-a812-63b3aa478149', '129a0d01-a139-471d-af2e-627ee136369c', 'revision', 'character', 'Revision identifier of the document', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character', 'revision');
INSERT INTO public.dataset_columns VALUES ('46f8d130-9a1f-42c5-b874-011fe4074575', '129a0d01-a139-471d-af2e-627ee136369c', 'document_summary', 'text', 'Summary or description of the document', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'text', 'document_summary');
INSERT INTO public.dataset_columns VALUES ('1175a9dd-38ec-4a7e-a8fa-6a950011bdd8', '129a0d01-a139-471d-af2e-627ee136369c', 'modified_date', 'timestamp without time zone', 'Date when the document was last modified', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('c4852776-6c2f-4dc5-90b3-c1e4f1e81a5d', '129a0d01-a139-471d-af2e-627ee136369c', 'rowguid', 'uuid', 'Unique global identifier for the record', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'uuid', 'rowguid');
INSERT INTO public.dataset_columns VALUES ('1d668606-1b53-4e77-9ffd-b23a1b59b57b', '129a0d01-a139-471d-af2e-627ee136369c', 'document_key', 'integer', 'Aggregated key representing the document identifier', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'document_key');
INSERT INTO public.dataset_columns VALUES ('c9ee9513-bb37-4ae6-9e54-739d3f579cce', '129a0d01-a139-471d-af2e-627ee136369c', 'owner', 'integer', 'Aggregated numeric identifier for the document owner', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'owner');
INSERT INTO public.dataset_columns VALUES ('5812e7b8-6f3f-49e2-9ceb-d5ed0123e1cc', '129a0d01-a139-471d-af2e-627ee136369c', 'change_number', 'integer', 'Total change number count for revisions', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'change_number');
INSERT INTO public.dataset_columns VALUES ('0668801a-93f5-434c-8168-25e44192d979', '129a0d01-a139-471d-af2e-627ee136369c', 'status', 'smallint', 'Aggregated status code for the document', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'smallint', 'status');
INSERT INTO public.dataset_columns VALUES ('51e4ef9c-e2cd-4f68-9ba8-1ed3f8064cad', '3702c05b-e03b-40fe-b7a1-1e9cdf592b25', 'modified_date', 'timestamp without time zone', 'Indicates the timestamp when the record was last updated', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('1cd3e201-1f25-4473-82ef-8d3005aef2e2', '3702c05b-e03b-40fe-b7a1-1e9cdf592b25', 'business_entity_contact_key', 'integer', 'Unique identifier for the business entity contact', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'business_entity_contact_key');
INSERT INTO public.dataset_columns VALUES ('ff023add-96e1-4464-9a3e-e60d9b88d773', '3702c05b-e03b-40fe-b7a1-1e9cdf592b25', 'business_entity_id', 'integer', 'Identifier linking to the corresponding business entity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'business_entity_id');
INSERT INTO public.dataset_columns VALUES ('06ec0b0d-1806-45ae-9e19-2d252f164306', '3702c05b-e03b-40fe-b7a1-1e9cdf592b25', 'fk_person', 'integer', 'Foreign key linking to the person entity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_person');
INSERT INTO public.dataset_columns VALUES ('c151e088-fba5-4e31-857c-f05d3ae6957b', '3702c05b-e03b-40fe-b7a1-1e9cdf592b25', 'contact_type_id', 'integer', 'Identifier for the type of contact', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'contact_type_id');
INSERT INTO public.dataset_columns VALUES ('4562e088-a29d-4452-b666-6d0f1d5abcee', '4d2fd88a-3779-42d8-a9fb-d2b2373705ba', 'transaction_date', 'timestamp without time zone', 'The date and time when the transaction occurred.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'transaction_date');
INSERT INTO public.dataset_columns VALUES ('b2a416ac-800c-4ae7-a239-be706739344e', '4d2fd88a-3779-42d8-a9fb-d2b2373705ba', 'transaction_type', 'character', 'The type or category of the transaction.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character', 'transaction_type');
INSERT INTO public.dataset_columns VALUES ('e4fdfa8e-dcba-47c3-8df7-a598853ad692', '4d2fd88a-3779-42d8-a9fb-d2b2373705ba', 'modified_date', 'timestamp without time zone', 'The date and time when the record was last modified.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('6f318b6a-ba68-44f8-aedc-40bcf0092420', '4d2fd88a-3779-42d8-a9fb-d2b2373705ba', 'transaction_history_key', 'integer', 'Unique key for the transaction history record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'transaction_history_key');
INSERT INTO public.dataset_columns VALUES ('3427bea4-456a-4904-9cd2-867dc1a64950', '4d2fd88a-3779-42d8-a9fb-d2b2373705ba', 'transaction_id', 'integer', 'Identifier for the transaction.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'transaction_id');
INSERT INTO public.dataset_columns VALUES ('ca665b61-f8a4-41c9-8489-20e21c55b135', '4d2fd88a-3779-42d8-a9fb-d2b2373705ba', 'product_id', 'integer', 'Identifier for the product involved in the transaction.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_id');
INSERT INTO public.dataset_columns VALUES ('89445465-6dd8-41c2-b30b-d6298661b891', '4d2fd88a-3779-42d8-a9fb-d2b2373705ba', 'reference_order_id', 'integer', 'Identifier for the reference order related to the transaction.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'reference_order_id');
INSERT INTO public.dataset_columns VALUES ('0edf8d3d-a08d-4d55-998e-38b52ca5a62d', '4d2fd88a-3779-42d8-a9fb-d2b2373705ba', 'reference_order_line_id', 'integer', 'Identifier for the specific line in the reference order.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'reference_order_line_id');
INSERT INTO public.dataset_columns VALUES ('9335e6a4-d035-4d77-9874-457b1c6994cd', '4d2fd88a-3779-42d8-a9fb-d2b2373705ba', 'quantity', 'integer', 'Quantity of the product transacted.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'quantity');
INSERT INTO public.dataset_columns VALUES ('ae696f4b-1b75-4081-b9ae-89f352f98aec', '4d2fd88a-3779-42d8-a9fb-d2b2373705ba', 'actual_cost', 'numeric', 'The actual cost recorded for the transaction.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'actual_cost');
INSERT INTO public.dataset_columns VALUES ('02e2d876-cb07-42e6-bde8-20f0fd71deee', 'ade73c2d-3866-40e5-bf92-0be3884e8ee2', 'description', 'character varying', 'Textual details providing information about the product.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'description');
INSERT INTO public.dataset_columns VALUES ('3f4152b7-e26f-488c-a649-04ca36d8b3b3', 'ade73c2d-3866-40e5-bf92-0be3884e8ee2', 'rowguid', 'uuid', 'Unique identifier ensuring distinct row entries.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'uuid', 'rowguid');
INSERT INTO public.dataset_columns VALUES ('12e79cd4-cccb-48b4-8da0-a7d0a1817507', 'ade73c2d-3866-40e5-bf92-0be3884e8ee2', 'modified_date', 'timestamp without time zone', 'The timestamp marking the last update to the record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('f7dbc85d-6263-4283-ac66-e6303f2d761d', 'ade73c2d-3866-40e5-bf92-0be3884e8ee2', 'product_description_key', 'integer', 'Summed numeric key uniquely identifying the record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_description_key');
INSERT INTO public.dataset_columns VALUES ('348f160b-5b91-4228-a8a2-90025c94cff9', 'ade73c2d-3866-40e5-bf92-0be3884e8ee2', 'product_description_id', 'integer', 'Summed identifier representing the product description record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_description_id');
INSERT INTO public.dataset_columns VALUES ('d553a3c8-6b8d-4ae0-a892-68b3ec4f0445', 'd484cfbd-bb0f-4d68-b501-e4b33d606085', 'start_date', 'timestamp without time zone', 'The date when the sales territory history record becomes effective.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'start_date');
INSERT INTO public.dataset_columns VALUES ('a153af97-d0c5-44d8-bf8e-6f64dd055d5c', 'd484cfbd-bb0f-4d68-b501-e4b33d606085', 'end_date', 'timestamp without time zone', 'The date when the sales territory history record expires.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'end_date');
INSERT INTO public.dataset_columns VALUES ('5558108f-b0cb-468c-8f95-38a9eea41c36', 'd484cfbd-bb0f-4d68-b501-e4b33d606085', 'rowguid', 'uuid', 'Unique identifier for the record, typically used for replication purposes.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'uuid', 'rowguid');
INSERT INTO public.dataset_columns VALUES ('386ea6c5-4787-43b2-b434-e8126f9300c8', 'd484cfbd-bb0f-4d68-b501-e4b33d606085', 'modified_date', 'timestamp without time zone', 'Timestamp indicating when the record was last modified.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('44d3da66-9b7b-4cbb-865c-913e9070bec8', 'd484cfbd-bb0f-4d68-b501-e4b33d606085', 'sales_territory_history_key', 'integer', 'Primary key for aggregating sales territory history records.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_territory_history_key');
INSERT INTO public.dataset_columns VALUES ('20641fda-bfb3-418c-99b7-8b331ae7740b', 'd484cfbd-bb0f-4d68-b501-e4b33d606085', 'business_entity_id', 'integer', 'Identifier for the business entity associated with this sales territory history.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'business_entity_id');
INSERT INTO public.dataset_columns VALUES ('b5611d17-094f-4119-aa0f-c74e72c9eb9a', 'd484cfbd-bb0f-4d68-b501-e4b33d606085', 'territory_id', 'integer', 'Identifier for the sales territory associated with this record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'territory_id');
INSERT INTO public.dataset_columns VALUES ('297e8412-b7c0-4f92-922d-8381b7c755d1', '986d5fd4-a7bb-4d9f-8736-5c400cee591f', 'card_type', 'character varying', 'Type of credit card, e.g., Visa, MasterCard', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'card_type');
INSERT INTO public.dataset_columns VALUES ('5f1c9477-e86b-48c2-939f-b2acdcd9f673', '986d5fd4-a7bb-4d9f-8736-5c400cee591f', 'card_number', 'character varying', 'Credit card number used for transactions', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'card_number');
INSERT INTO public.dataset_columns VALUES ('2b1d52b2-36e7-4c46-81c1-a3ea719c7ac3', '986d5fd4-a7bb-4d9f-8736-5c400cee591f', 'modified_date', 'timestamp without time zone', 'The date when the credit card record was last updated', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('d369fdb6-fcab-4e76-a2ed-9f880581de3c', '986d5fd4-a7bb-4d9f-8736-5c400cee591f', 'credit_card_key', 'integer', 'Unique key identifier for the credit card', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'credit_card_key');
INSERT INTO public.dataset_columns VALUES ('972e10e8-6fbc-4a93-b408-703c76d6fa37', '986d5fd4-a7bb-4d9f-8736-5c400cee591f', 'credit_card_id', 'integer', 'Credit card identifier corresponding to external records', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'credit_card_id');
INSERT INTO public.dataset_columns VALUES ('00473c1f-771a-4321-b329-af224cc12167', '986d5fd4-a7bb-4d9f-8736-5c400cee591f', 'exp_month', 'smallint', 'Expiration month of the credit card', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'smallint', 'exp_month');
INSERT INTO public.dataset_columns VALUES ('c19bb532-5f27-4620-acaa-10b5a05a2f63', '986d5fd4-a7bb-4d9f-8736-5c400cee591f', 'exp_year', 'smallint', 'Expiration year of the credit card', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'smallint', 'exp_year');
INSERT INTO public.dataset_columns VALUES ('9a1cecfe-ad6e-45ff-a521-150d0558ead6', '4d452aad-a4ca-4f9e-a91c-b954025eaa34', 'product_name', 'character varying', 'The name of the product.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'product_name');
INSERT INTO public.dataset_columns VALUES ('b154be01-9eea-433e-8c8a-a2024abf10be', '4d452aad-a4ca-4f9e-a91c-b954025eaa34', 'location_name', 'character varying', 'The location where the product is stored or sold.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'location_name');
INSERT INTO public.dataset_columns VALUES ('0cb6bdaa-0a17-487f-9da0-3450eb3f92c6', '4d452aad-a4ca-4f9e-a91c-b954025eaa34', 'modified_date', 'timestamp without time zone', 'The timestamp when the inventory record was last updated.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('7f6893bd-697e-4e20-8b46-37351e01af20', '4d452aad-a4ca-4f9e-a91c-b954025eaa34', 'product_inventory_key', 'integer', 'Unique key identifier for product inventory records.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_inventory_key');
INSERT INTO public.dataset_columns VALUES ('a95f528a-2db8-41c6-8a75-c9ec1791331f', '4d452aad-a4ca-4f9e-a91c-b954025eaa34', 'fk_product', 'integer', 'Foreign key linking to product entity.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_product');
INSERT INTO public.dataset_columns VALUES ('24ea16b7-a2ca-492c-bbda-4c425b155469', '4d452aad-a4ca-4f9e-a91c-b954025eaa34', 'fk_location', 'integer', 'Foreign key linking to location entity.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_location');
INSERT INTO public.dataset_columns VALUES ('df52cfd0-ec20-4c29-9955-61b2eb18e937', '4d452aad-a4ca-4f9e-a91c-b954025eaa34', 'quantity', 'smallint', 'The quantity of product available in inventory.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'smallint', 'quantity');
INSERT INTO public.dataset_columns VALUES ('9247bb53-161b-436d-8e6a-91679f005c7f', 'd49bcdad-4a59-48f3-b1e5-13970a621829', 'modified_date', 'timestamp without time zone', 'Timestamp representing the last update to the record', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('4b5f7d57-e078-407f-84e3-a38a017b987a', 'd49bcdad-4a59-48f3-b1e5-13970a621829', 'person_credit_card_key', 'integer', 'Unique identifier for the person credit card record', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'person_credit_card_key');
INSERT INTO public.dataset_columns VALUES ('d50a05dd-4a69-476e-b652-820565b1d295', 'd49bcdad-4a59-48f3-b1e5-13970a621829', 'fk_person', 'integer', 'Foreign key linking to the person entity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_person');
INSERT INTO public.dataset_columns VALUES ('116ddcfa-3fbe-4b88-9b84-17fa3e6ef973', 'd49bcdad-4a59-48f3-b1e5-13970a621829', 'fk_credit_card', 'integer', 'Foreign key linking to the credit card entity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_credit_card');
INSERT INTO public.dataset_columns VALUES ('02cf3857-1d7d-4513-b3ae-d4cb5f62d855', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'first_name', 'character varying', 'The first name of the sales person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'first_name');
INSERT INTO public.dataset_columns VALUES ('9cb8ece5-29e6-4ee1-9658-cee482a29d1d', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'last_name', 'character varying', 'The last name of the sales person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'last_name');
INSERT INTO public.dataset_columns VALUES ('76b2d365-8757-4a5d-9cf7-d6431790d657', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'territory_name', 'character varying', 'The name of the territory assigned to the sales person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'territory_name');
INSERT INTO public.dataset_columns VALUES ('f5fc2a29-f0af-4252-ac81-75dbecbb667e', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'modified_date', 'timestamp without time zone', 'The date and time when the record was last modified', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('9d293662-0f61-4c62-bf31-d049955da1b3', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'segment_quota_status', 'text', 'The current quota status segment of the sales person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'text', 'segment_quota_status');
INSERT INTO public.dataset_columns VALUES ('104aef71-1aea-426d-92e1-9b9139c9e089', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'sales_person_key', 'integer', 'A unique key identifying the sales person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_person_key');
INSERT INTO public.dataset_columns VALUES ('8b49f604-df82-4069-a550-1bfef06e17b4', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'fk_person', 'integer', 'Foreign key linking to the person entity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_person');
INSERT INTO public.dataset_columns VALUES ('925a2115-0561-4204-8b4f-1eb6a0d243d9', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'fk_territory', 'integer', 'Foreign key linking to the territory entity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_territory');
INSERT INTO public.dataset_columns VALUES ('1f31b59f-f1a5-4f41-be6a-4fc04777e508', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'sales_quota', 'numeric', 'The total sales quota assigned to the sales person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'sales_quota');
INSERT INTO public.dataset_columns VALUES ('493c276d-4930-4811-be29-17c8cf1ee66a', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'bonus', 'numeric', 'Bonus earned by the sales person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'bonus');
INSERT INTO public.dataset_columns VALUES ('4619ef26-c32f-4292-bed4-20f5ce2928c9', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'commission_pct', 'numeric', 'The commission percentage applicable to the sales person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'commission_pct');
INSERT INTO public.dataset_columns VALUES ('fb16342b-184d-4465-b07a-728a9140d590', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'sales_ytd', 'numeric', 'Year-to-date sales figure for the sales person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'sales_ytd');
INSERT INTO public.dataset_columns VALUES ('42d5c8ee-a9f0-4af8-8b77-4fce26dccb86', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'sales_last_year', 'numeric', 'Total sales made by the sales person in the previous year', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'sales_last_year');
INSERT INTO public.dataset_columns VALUES ('e706e63f-b0d7-49e4-a77b-6ab44dd29de3', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'total_sales_last_12_months', 'numeric', 'Aggregate sales over the last twelve months', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'total_sales_last_12_months');
INSERT INTO public.dataset_columns VALUES ('83ccdc38-ae7a-41b2-b4db-a467d823bc4c', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'total_orders_last_12_months', 'bigint', 'Total number of orders processed in the last twelve months', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'bigint', 'total_orders_last_12_months');
INSERT INTO public.dataset_columns VALUES ('26514a33-f061-4961-a9db-75920b271d02', '9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'average_order_value_last_12_months', 'numeric', 'Average value of orders over the last twelve months', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'average_order_value_last_12_months');
INSERT INTO public.dataset_columns VALUES ('f259994d-e526-4560-bb30-f5772ec81872', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'scheduled_start_date', 'timestamp without time zone', 'The timestamp indicating when the work order is scheduled to begin.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'scheduled_start_date');
INSERT INTO public.dataset_columns VALUES ('91a5560d-a3aa-4d46-aa92-bf9d776a9008', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'scheduled_end_date', 'timestamp without time zone', 'The timestamp indicating when the work order is scheduled to be completed.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'scheduled_end_date');
INSERT INTO public.dataset_columns VALUES ('8c16a6ef-47c4-4ac4-bf97-b5a3ad355f09', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'actual_start_date', 'timestamp without time zone', 'The recorded timestamp when the work order actually began.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'actual_start_date');
INSERT INTO public.dataset_columns VALUES ('445c0c06-1735-4e19-a106-c275dde1edfa', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'actual_end_date', 'timestamp without time zone', 'The recorded timestamp when the work order actually ended.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'actual_end_date');
INSERT INTO public.dataset_columns VALUES ('be533a80-e97a-49a7-a4f2-dbf164d979d1', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'modified_date', 'timestamp without time zone', 'The timestamp of the last modification made to the work order routing record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('f414e650-23ef-4ef4-b763-1d0d8871bc6f', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'work_order_routing_key', 'integer', 'A unique identifier for the work order routing record, used for aggregation.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'work_order_routing_key');
INSERT INTO public.dataset_columns VALUES ('0c5cb128-0749-4af1-b596-105a976b46b9', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'work_order_id', 'integer', 'The identifier linking the record to a specific work order for aggregation purposes.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'work_order_id');
INSERT INTO public.dataset_columns VALUES ('ea93f536-cb2a-4217-b932-2a97e37e8ad7', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'product_id', 'integer', 'The identifier of the product associated with the work order routing, used for aggregation.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_id');
INSERT INTO public.dataset_columns VALUES ('d6f08f00-b006-42aa-a199-fbab3c38d6b0', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'operation_sequence', 'smallint', 'The sequence order of operations in the routing process, summed for analysis.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'smallint', 'operation_sequence');
INSERT INTO public.dataset_columns VALUES ('3ffb0fa6-70ab-4e8f-8e58-b95a763bdd20', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'location_id', 'integer', 'The identifier for the location where the work order routing is executed, used in aggregations.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'location_id');
INSERT INTO public.dataset_columns VALUES ('ed69ebf3-9edd-4e6e-b5e4-bb823dc2e07e', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'actual_resource_hrs', 'numeric', 'The total hours of resources actually utilized in the work order routing.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'actual_resource_hrs');
INSERT INTO public.dataset_columns VALUES ('d59d7181-b5b2-40e9-b9b3-5070075ae303', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'planned_cost', 'numeric', 'The estimated cost associated with the work order routing, summed across records.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'planned_cost');
INSERT INTO public.dataset_columns VALUES ('32ab2aea-b2ce-4024-b58f-223b5f5b4a36', '3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'actual_cost', 'numeric', 'The actual cost incurred during the execution of the work order routing.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'actual_cost');
INSERT INTO public.dataset_columns VALUES ('8a4d2777-3613-4aca-9471-63dc3fe4a1c6', '2ca39c75-70bc-48d8-aa5e-3e77a5dcb7a8', 'address_line1', 'character varying', 'The primary address line', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'address_line1');
INSERT INTO public.dataset_columns VALUES ('c3233272-9163-4362-aea3-834e426cca96', '2ca39c75-70bc-48d8-aa5e-3e77a5dcb7a8', 'address_line2', 'character varying', 'The secondary address line, if applicable', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'address_line2');
INSERT INTO public.dataset_columns VALUES ('86f30e09-a315-4b2a-9233-455f3715b5d5', '2ca39c75-70bc-48d8-aa5e-3e77a5dcb7a8', 'city', 'character varying', 'The city of the address', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'city');
INSERT INTO public.dataset_columns VALUES ('c2f81c25-5f7c-483c-931b-793ddac64e9c', '2ca39c75-70bc-48d8-aa5e-3e77a5dcb7a8', 'postal_code', 'character varying', 'The postal or ZIP code', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'postal_code');
INSERT INTO public.dataset_columns VALUES ('d9a352e6-6282-45fa-b624-2f47e7929108', '2ca39c75-70bc-48d8-aa5e-3e77a5dcb7a8', 'address_type', 'character varying', 'The type of address (e.g., residential, commercial)', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'address_type');
INSERT INTO public.dataset_columns VALUES ('5931d758-ad82-43c3-9c3f-d906da743397', '2ca39c75-70bc-48d8-aa5e-3e77a5dcb7a8', 'modified_date', 'timestamp without time zone', 'The date and time when the address was last updated', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('be0a1f72-39a9-4dc8-a22e-de1039781383', '2ca39c75-70bc-48d8-aa5e-3e77a5dcb7a8', 'address_key', 'integer', 'Aggregate key for address records', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'address_key');
INSERT INTO public.dataset_columns VALUES ('f3551240-d7cb-4a03-9b47-597b04990dab', '2ca39c75-70bc-48d8-aa5e-3e77a5dcb7a8', 'address_id', 'integer', 'Unique identifier for the address', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'address_id');
INSERT INTO public.dataset_columns VALUES ('333d55da-0330-4a5b-8f9c-464bad28870c', '2ca39c75-70bc-48d8-aa5e-3e77a5dcb7a8', 'state_province_id', 'integer', 'Identifier for the state or province', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'state_province_id');
INSERT INTO public.dataset_columns VALUES ('d3f59c71-e8bc-47b3-828f-901f7b264881', '239bd917-3736-433e-95e9-17bcc38af6de', 'currency_code', 'character', 'Unique code representing the currency', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character', 'currency_code');
INSERT INTO public.dataset_columns VALUES ('2000354e-6f84-44c9-8796-1e94bdaede5e', '239bd917-3736-433e-95e9-17bcc38af6de', 'name', 'character varying', 'Official name of the currency', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('09d93c28-7acd-4ce5-a481-98335c4e93ff', '239bd917-3736-433e-95e9-17bcc38af6de', 'modified_date', 'timestamp without time zone', 'Timestamp indicating when the record was last updated', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('f6dacfa6-c299-4657-b221-22f41e5b4090', '239bd917-3736-433e-95e9-17bcc38af6de', 'currency_key', 'integer', 'Aggregate key used for summing currency values', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'currency_key');
INSERT INTO public.dataset_columns VALUES ('c9750e09-b554-43bf-acf2-b2c88bfced19', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'order_date', 'timestamp without time zone', 'Date when the order was placed', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'order_date');
INSERT INTO public.dataset_columns VALUES ('586db430-fb24-40ce-935b-3e864279068d', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'due_date', 'timestamp without time zone', 'Due date for order delivery', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'due_date');
INSERT INTO public.dataset_columns VALUES ('cfd0d57d-708b-4831-a3a3-56d5a1e37156', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'vendor_name', 'character varying', 'Name of the vendor supplying the order', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'vendor_name');
INSERT INTO public.dataset_columns VALUES ('8068fbd5-c4ef-4806-9aba-4f6172c09bbe', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'product_name', 'character varying', 'Name or description of the product ordered', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'product_name');
INSERT INTO public.dataset_columns VALUES ('69187625-6b47-49d7-ab04-e77d0c3b6d93', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'modified_date', 'timestamp without time zone', 'Date when the order record was last modified', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('b3a24342-7815-4a25-9dc9-e3a7955fe4c4', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'segment_recent_purchase', 'text', 'Segment categorization for recent purchases', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'text', 'segment_recent_purchase');
INSERT INTO public.dataset_columns VALUES ('c25717e7-aa4d-4f3e-b0d9-1e68533fff8a', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'purchase_key', 'integer', 'Unique key identifying the purchase', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'purchase_key');
INSERT INTO public.dataset_columns VALUES ('bab97e2e-eff0-4b06-92b2-35a8382b3015', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'purchase_order_id', 'integer', 'Identifier associated with the purchase order', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'purchase_order_id');
INSERT INTO public.dataset_columns VALUES ('47119bab-476c-496a-b122-6795e974c930', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'fk_vendor', 'integer', 'Foreign key linking to the vendor entity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_vendor');
INSERT INTO public.dataset_columns VALUES ('d26720ea-f87e-466a-8135-5019b80ac206', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'fk_product', 'integer', 'Foreign key linking to the product entity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_product');
INSERT INTO public.dataset_columns VALUES ('2dc44ada-0b1a-4a41-af76-ce174a98d34a', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'order_qty', 'smallint', 'Quantity of products ordered', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'smallint', 'order_qty');
INSERT INTO public.dataset_columns VALUES ('d734de7d-1fcc-4703-af32-935cb3872894', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'unit_price', 'numeric', 'Price per unit of the product at the time of purchase', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'unit_price');
INSERT INTO public.dataset_columns VALUES ('e3bc9907-a6f7-4392-8a32-9f587cfa72f1', '547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'total_cost', 'numeric', 'Total cost computed for the order', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'total_cost');
INSERT INTO public.dataset_columns VALUES ('d5a51d4a-e1e5-43de-a1ec-9b375053bf04', 'a452d58f-af91-40ca-82c6-c3eb94139684', 'name', 'character varying', 'The descriptive name for the scrap reason.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('cb0f9505-5569-43cf-8078-04ffd506e88b', 'a452d58f-af91-40ca-82c6-c3eb94139684', 'modified_date', 'timestamp without time zone', 'The timestamp indicating when the scrap reason was last modified.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('e68d9ae0-1cd3-468c-b4fe-704f9e79dfac', 'a452d58f-af91-40ca-82c6-c3eb94139684', 'scrap_reason_key', 'integer', 'The key identifier used for aggregating scrap reasons.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'scrap_reason_key');
INSERT INTO public.dataset_columns VALUES ('f41f9ee4-cc33-49d5-8399-766e25ae629b', 'a452d58f-af91-40ca-82c6-c3eb94139684', 'scrap_reason_id', 'integer', 'The unique identifier for each scrap reason entry.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'scrap_reason_id');
INSERT INTO public.dataset_columns VALUES ('c55102ca-c932-453e-b204-99c56a933bb0', '3b177be3-b9b7-4d50-8429-2619727f503d', 'product_name', 'character varying', 'The name of the product associated with the work order.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'product_name');
INSERT INTO public.dataset_columns VALUES ('20cd1409-0d0d-4c58-9d33-0ac1dcccaa63', '3b177be3-b9b7-4d50-8429-2619727f503d', 'start_date', 'timestamp without time zone', 'The starting date when the work order becomes active.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'start_date');
INSERT INTO public.dataset_columns VALUES ('481b4fc0-41d8-46c5-89ab-31510e7ea084', '3b177be3-b9b7-4d50-8429-2619727f503d', 'end_date', 'timestamp without time zone', 'The ending date when the work order is scheduled to finish.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'end_date');
INSERT INTO public.dataset_columns VALUES ('2239700c-636a-4c17-8412-9b76fd8ad29f', '3b177be3-b9b7-4d50-8429-2619727f503d', 'due_date', 'timestamp without time zone', 'The due date by which the work order must be completed.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'due_date');
INSERT INTO public.dataset_columns VALUES ('b380e16b-62f0-4ba0-bd63-a38ac8d58149', '3b177be3-b9b7-4d50-8429-2619727f503d', 'modified_date', 'timestamp without time zone', 'The date when modifications were last made to the work order.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('4378ccc3-b5e4-4a60-a8c5-45f7c7f54747', '3b177be3-b9b7-4d50-8429-2619727f503d', 'segment_scrap_status', 'text', 'Indicator of whether any segment of the work order has been scrapped.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'text', 'segment_scrap_status');
INSERT INTO public.dataset_columns VALUES ('8077ec90-e1b4-4403-a34a-d8e274b2fde3', '3b177be3-b9b7-4d50-8429-2619727f503d', 'work_order_key', 'integer', 'A unique key used for aggregating work order data.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'work_order_key');
INSERT INTO public.dataset_columns VALUES ('effaf7bc-28aa-45e4-932c-628856f3b76a', '3b177be3-b9b7-4d50-8429-2619727f503d', 'work_order_id', 'integer', 'An identifier for the work order used in aggregation tasks.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'work_order_id');
INSERT INTO public.dataset_columns VALUES ('e26876e5-7c1b-4920-b2b4-5ab6d91aca06', '3b177be3-b9b7-4d50-8429-2619727f503d', 'fk_product', 'integer', 'Foreign key linking the work order to a specific product.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_product');
INSERT INTO public.dataset_columns VALUES ('80a0d7b6-6cae-4937-8a8f-d156b8914da3', '3b177be3-b9b7-4d50-8429-2619727f503d', 'order_qty', 'integer', 'The total quantity ordered in this work order.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'order_qty');
INSERT INTO public.dataset_columns VALUES ('569f817b-5bbd-41e4-bff2-4cef7dd7ad53', '3b177be3-b9b7-4d50-8429-2619727f503d', 'scrapped_qty', 'smallint', 'The total quantity that has been scrapped or rejected.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'smallint', 'scrapped_qty');
INSERT INTO public.dataset_columns VALUES ('212b99af-d50a-4c8e-8585-c734e7062f8c', '3b177be3-b9b7-4d50-8429-2619727f503d', 'order_completion_ratio', 'numeric', 'A ratio that indicates the degree of order completion relative to the total quantity.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'order_completion_ratio');
INSERT INTO public.dataset_columns VALUES ('8a65cf9c-0828-425f-8a7c-e574295e6aba', 'f74d1538-8402-4e4c-a380-49287263de9d', 'name', 'character varying', 'The name of the sales territory', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('8238f373-35fa-47d1-8ff2-ba9306c04638', 'f74d1538-8402-4e4c-a380-49287263de9d', 'country_region_code', 'character varying', 'The country or region code associated with the territory', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'country_region_code');
INSERT INTO public.dataset_columns VALUES ('fe385496-7a6a-4acd-932b-29820c9d46b8', 'f74d1538-8402-4e4c-a380-49287263de9d', 'group_name', 'character varying', 'The group or department name within the sales structure', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'group_name');
INSERT INTO public.dataset_columns VALUES ('c1feb1d8-f164-4292-aa92-fbfea1951d45', 'f74d1538-8402-4e4c-a380-49287263de9d', 'rowguid', 'uuid', 'A unique identifier (GUID) for the record', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'uuid', 'rowguid');
INSERT INTO public.dataset_columns VALUES ('ab5a5f45-b97c-41e2-ab30-ef0668eb3f40', 'f74d1538-8402-4e4c-a380-49287263de9d', 'modified_date', 'timestamp without time zone', 'The date and time when the record was last modified', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('1226006d-736f-43e7-ae89-d5c9af41772a', 'f74d1538-8402-4e4c-a380-49287263de9d', 'territory_key', 'integer', 'A numerical key representing the territory', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'territory_key');
INSERT INTO public.dataset_columns VALUES ('efc33faf-9d53-49df-aaf3-218ec2503103', 'f74d1538-8402-4e4c-a380-49287263de9d', 'territory_id', 'integer', 'The unique identifier for the territory used in aggregations', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'territory_id');
INSERT INTO public.dataset_columns VALUES ('3886d499-6194-4cd7-bbb0-9cbcc76d37dc', 'f74d1538-8402-4e4c-a380-49287263de9d', 'sales_ytd', 'numeric', 'Year-to-date total sales for the territory', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'sales_ytd');
INSERT INTO public.dataset_columns VALUES ('9581c3ee-7670-4314-9386-bb154b778948', 'f74d1538-8402-4e4c-a380-49287263de9d', 'sales_last_year', 'numeric', 'Total sales from the previous year for the territory', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'sales_last_year');
INSERT INTO public.dataset_columns VALUES ('ca63154d-3169-4374-9381-1eff434ad3d6', 'f74d1538-8402-4e4c-a380-49287263de9d', 'cost_ytd', 'numeric', 'Year-to-date total cost associated with the territory', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'cost_ytd');
INSERT INTO public.dataset_columns VALUES ('31b156e0-a0e8-44e4-9a28-cb40eb3ac376', 'f74d1538-8402-4e4c-a380-49287263de9d', 'cost_last_year', 'numeric', 'Total cost incurred in the previous year for the territory', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'cost_last_year');
INSERT INTO public.dataset_columns VALUES ('a33fb0ba-22a4-46c8-8336-603e95a1748e', '494b86b1-f12f-41a6-b03b-2ae17653684b', 'name', 'character varying', 'The name of the shipping method.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('104030d5-bcaf-41c6-a5a1-d75a06cfa9e1', '494b86b1-f12f-41a6-b03b-2ae17653684b', 'rowguid', 'uuid', 'The unique identifier (UUID) for the record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'uuid', 'rowguid');
INSERT INTO public.dataset_columns VALUES ('e2fb3eaf-39eb-4f80-87c5-5a3f581cc764', '494b86b1-f12f-41a6-b03b-2ae17653684b', 'modified_date', 'timestamp without time zone', 'The date and time when the record was last updated.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('18b5b183-bea1-4dd3-998b-376865e16636', '494b86b1-f12f-41a6-b03b-2ae17653684b', 'ship_method_key', 'integer', 'Sum of unique keys for shipping methods.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'ship_method_key');
INSERT INTO public.dataset_columns VALUES ('6bbac76e-f35b-4208-9388-665c2e4ab08e', '494b86b1-f12f-41a6-b03b-2ae17653684b', 'ship_method_id', 'integer', 'Sum of shipping method IDs.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'ship_method_id');
INSERT INTO public.dataset_columns VALUES ('eec4334a-8d48-4a79-b551-7fd5b0296df9', '494b86b1-f12f-41a6-b03b-2ae17653684b', 'ship_base', 'numeric', 'Sum of base shipping costs.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'ship_base');
INSERT INTO public.dataset_columns VALUES ('3c85fc22-ecaa-4a3d-97d0-88ccc9226ccf', '494b86b1-f12f-41a6-b03b-2ae17653684b', 'ship_rate', 'numeric', 'Sum of shipping rates applied.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'ship_rate');
INSERT INTO public.dataset_columns VALUES ('56fb457c-686d-4b7d-87ab-070e69b5e171', '22799ae1-d5b5-4a75-969f-971e796465c8', 'name', 'character varying', 'The name of the sales tax rate, typically describing the tax category or designation.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('576beca9-23bb-4661-a295-92fdb4acd21f', '22799ae1-d5b5-4a75-969f-971e796465c8', 'rowguid', 'uuid', 'Unique row identifier (GUID) for the sales tax rate record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'uuid', 'rowguid');
INSERT INTO public.dataset_columns VALUES ('e9c72ecb-0716-43a3-b8c1-b1a421931433', '22799ae1-d5b5-4a75-969f-971e796465c8', 'modified_date', 'timestamp without time zone', 'Timestamp marking the last modification date of the sales tax rate record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('80f98509-026a-45ad-bdf8-7b09d5fc64b1', '22799ae1-d5b5-4a75-969f-971e796465c8', 'sales_tax_rate_key', 'integer', 'Unique key for the sales tax rate used in calculations and aggregations.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_tax_rate_key');
INSERT INTO public.dataset_columns VALUES ('4c38e74d-e0f6-4265-8f7d-3e3ca42bdbab', '22799ae1-d5b5-4a75-969f-971e796465c8', 'sales_tax_rate_id', 'integer', 'Identifier for the sales tax rate record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_tax_rate_id');
INSERT INTO public.dataset_columns VALUES ('5992cbb5-06cd-4938-b141-808f4118d3c0', '22799ae1-d5b5-4a75-969f-971e796465c8', 'state_province_id', 'integer', 'Identifier linking the tax rate to its respective state or province.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'state_province_id');
INSERT INTO public.dataset_columns VALUES ('6ea6598e-9972-4b75-bddf-2c4cebf1d1d2', '22799ae1-d5b5-4a75-969f-971e796465c8', 'tax_type', 'smallint', 'Indicator representing the type of tax, such as state or local.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'smallint', 'tax_type');
INSERT INTO public.dataset_columns VALUES ('f4d36461-7b86-4f92-bc81-9550ecc171bc', '22799ae1-d5b5-4a75-969f-971e796465c8', 'tax_rate', 'numeric', 'Numeric value indicating the percentage rate of the sales tax.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'tax_rate');
INSERT INTO public.dataset_columns VALUES ('29882cbb-af57-41fa-a8f5-9cb4ed1e90e6', 'e5aa8a57-3ef3-4470-b463-79ad0ecaad8e', 'modified_date', 'timestamp without time zone', 'Represents the timestamp of the last modification to the record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('17eea3a7-c641-4a30-8a98-ef2986057f41', 'e5aa8a57-3ef3-4470-b463-79ad0ecaad8e', 'sales_order_header_sales_reason_key', 'integer', 'Aggregated identifier for the sales order header sales reason.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_order_header_sales_reason_key');
INSERT INTO public.dataset_columns VALUES ('9baaa17a-1d28-4fa7-a270-bc1c8976281f', 'e5aa8a57-3ef3-4470-b463-79ad0ecaad8e', 'sales_order_id', 'integer', 'Aggregated unique identifier for the sales order.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_order_id');
INSERT INTO public.dataset_columns VALUES ('4d216c7d-04f7-4b3a-81e1-cba8e3f5c7d4', 'e5aa8a57-3ef3-4470-b463-79ad0ecaad8e', 'sales_reason_id', 'integer', 'Aggregated unique identifier for the sales reason category.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_reason_id');
INSERT INTO public.dataset_columns VALUES ('f9f7533a-b16b-4ce2-83c6-053d6012eb42', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'first_name', 'character varying', 'Employee''s first name', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'first_name');
INSERT INTO public.dataset_columns VALUES ('fc4e0a7a-63e4-406b-afdf-dd92c57e8d89', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'last_name', 'character varying', 'Employee''s last name', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'last_name');
INSERT INTO public.dataset_columns VALUES ('e33239b4-48d6-43d9-9ed6-a609d66ee4ac', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'job_title', 'character varying', 'Title of the employee''s job position', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'job_title');
INSERT INTO public.dataset_columns VALUES ('b421bd99-2d06-44a1-aacd-3ea0270df3b4', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'hire_date', 'date', 'Employee''s hire date', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'date', 'hire_date');
INSERT INTO public.dataset_columns VALUES ('0233fa28-69b0-49d1-b628-7b18274cfd12', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'birth_date', 'date', 'Employee''s date of birth', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'date', 'birth_date');
INSERT INTO public.dataset_columns VALUES ('1518e576-3eb8-41ae-89dd-c3a691db877f', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'marital_status', 'character', 'Employee''s marital status', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character', 'marital_status');
INSERT INTO public.dataset_columns VALUES ('b9680755-4975-4802-8ad1-0073dc5f78e1', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'gender', 'character', 'Employee''s gender', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character', 'gender');
INSERT INTO public.dataset_columns VALUES ('f4be1099-148d-4fa0-86e8-fda35db479c1', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'modified_date', 'timestamp without time zone', 'Record''s last modified date', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('86f690d9-13b3-44d2-bb43-958e3d24881c', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'segment_employment_status', 'text', 'Segment classification of employment status', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'text', 'segment_employment_status');
INSERT INTO public.dataset_columns VALUES ('fe18fa87-3fa3-4b4e-bff8-18090f088b59', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'employee_key', 'integer', 'Unique key identifier for the employee', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'employee_key');
INSERT INTO public.dataset_columns VALUES ('9a160be8-c1bb-47c5-ae3f-fdfb8c7f0f9c', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'fk_person', 'integer', 'Foreign key to the associated person record', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_person');
INSERT INTO public.dataset_columns VALUES ('d1303092-3d8f-4ce8-8e08-d4242bf58400', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'avg_pay_rate', 'numeric', 'Average pay rate for the employee', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'avg_pay_rate');
INSERT INTO public.dataset_columns VALUES ('cfbfd6d2-9fa9-4458-8570-da83093d14d7', '8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'tenure_years', 'numeric', 'Calculated employee tenure in years', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'tenure_years');
INSERT INTO public.dataset_columns VALUES ('3777a588-9ef6-4a14-b374-7cfe3c899fba', 'd39747a7-1a07-4ea2-b057-49541771a647', 'name', 'character varying', 'The name identifying the entity or shift record', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('b325819f-ce59-4bd7-903e-0a0ee44db65e', 'd39747a7-1a07-4ea2-b057-49541771a647', 'start_time', 'time without time zone', 'The starting time of the shift', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'time without time zone', 'start_time');
INSERT INTO public.dataset_columns VALUES ('0ee87e86-776b-48d2-8cf6-0873e2cc5bcd', 'd39747a7-1a07-4ea2-b057-49541771a647', 'end_time', 'time without time zone', 'The ending time of the shift', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'time without time zone', 'end_time');
INSERT INTO public.dataset_columns VALUES ('2b99c9a1-f5df-4e15-9fdd-14e63905740a', 'd39747a7-1a07-4ea2-b057-49541771a647', 'modified_date', 'timestamp without time zone', 'The timestamp when the record was last modified', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('1abeba43-4ecf-4c9f-8fb6-1270ca349f63', 'd39747a7-1a07-4ea2-b057-49541771a647', 'shift_key', 'integer', 'Aggregate sum of shift keys for numerical summarization', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'shift_key');
INSERT INTO public.dataset_columns VALUES ('79c375b3-f9f6-406c-9cdb-f6543fdba7a1', 'd39747a7-1a07-4ea2-b057-49541771a647', 'shift_id', 'integer', 'Aggregate sum of shift IDs for numerical summarization', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'shift_id');
INSERT INTO public.dataset_columns VALUES ('6532ea5c-b4a4-40bb-80f0-6b86ce4c5468', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'first_name', 'character varying', 'The first name of the customer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'first_name');
INSERT INTO public.dataset_columns VALUES ('bfeeaced-4ba3-4f28-95c7-66a590242949', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'last_name', 'character varying', 'The last name of the customer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'last_name');
INSERT INTO public.dataset_columns VALUES ('206631f9-8478-4a6f-8279-a1acb916f176', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'email_address', 'character varying', 'The email address of the customer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'email_address');
INSERT INTO public.dataset_columns VALUES ('e491351b-09fe-483c-a40d-f6aee9fb4039', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'modified_date', 'timestamp without time zone', 'The date when the customer record was last modified.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('d4edda71-6fcb-46b7-b4eb-aa9cd1907078', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'segment_active_customer', 'text', 'Indicator if the customer is actively engaged.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'text', 'segment_active_customer');
INSERT INTO public.dataset_columns VALUES ('fc01c3ea-349e-4562-b02f-8183ac7684ae', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'customer_key', 'integer', 'Unique identifier key for the customer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'customer_key');
INSERT INTO public.dataset_columns VALUES ('571ca6a3-1358-4b89-ae11-63b0450fe6db', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'customer_id', 'integer', 'Identifier for the customer record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'customer_id');
INSERT INTO public.dataset_columns VALUES ('f9b1319d-46e5-4d4e-b080-b4f8b0e17f48', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'fk_person', 'integer', 'Foreign key linking to the person record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_person');
INSERT INTO public.dataset_columns VALUES ('56eefd7c-9f26-41e9-bb20-792f35ffe5a9', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'fk_store', 'integer', 'Foreign key linking to the store record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_store');
INSERT INTO public.dataset_columns VALUES ('08710e63-9f10-45e4-9ff4-d1d7919b5511', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'fk_territory', 'integer', 'Foreign key linking to the territory record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_territory');
INSERT INTO public.dataset_columns VALUES ('6700b8fe-1485-4de5-8b0f-0cf9fa45a3c7', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'total_orders_last_12_months', 'bigint', 'Total number of orders in the last 12 months.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'bigint', 'total_orders_last_12_months');
INSERT INTO public.dataset_columns VALUES ('80a397ac-9290-4bfb-a2f6-34f798781c6b', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'total_revenue_last_12_months', 'numeric', 'Total revenue generated in the last 12 months.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'total_revenue_last_12_months');
INSERT INTO public.dataset_columns VALUES ('97c34213-4ac3-4434-badc-62297b7de0b9', 'fbd94258-7e8b-461c-9174-e3730b38428b', 'avg_order_value_last_12_months', 'numeric', 'Average order value over the last 12 months.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'avg_order_value_last_12_months');
INSERT INTO public.dataset_columns VALUES ('8f6f5bb6-471d-4571-9d8d-4ef2ce5a4153', 'bf277d59-9cca-4e26-bb1d-9bb2f6b91b93', 'rowguid', 'uuid', 'Unique identifier for the special offer product.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'uuid', 'rowguid');
INSERT INTO public.dataset_columns VALUES ('432f5452-deb4-4f5a-910c-62211718b7f6', 'bf277d59-9cca-4e26-bb1d-9bb2f6b91b93', 'modified_date', 'timestamp without time zone', 'Date and time when the record was last modified.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('6fe0916d-9ad1-4566-bfa8-8f605207ebb6', 'bf277d59-9cca-4e26-bb1d-9bb2f6b91b93', 'special_offer_product_key', 'integer', 'Primary key for the special offer product record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'special_offer_product_key');
INSERT INTO public.dataset_columns VALUES ('2d4495f4-1d19-47e9-af68-d63a13a707ce', 'bf277d59-9cca-4e26-bb1d-9bb2f6b91b93', 'special_offer_id', 'integer', 'Identifier for the special offer associated with the product.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'special_offer_id');
INSERT INTO public.dataset_columns VALUES ('9e5ff26f-63b3-434a-a63a-9ee10d089b26', 'bf277d59-9cca-4e26-bb1d-9bb2f6b91b93', 'product_id', 'integer', 'Identifier for the product in the special offer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_id');
INSERT INTO public.dataset_columns VALUES ('3403a1e3-e773-482a-bf37-1d8aaa4abf2c', '2c2cd754-7969-4e2c-8912-44329e528c5d', 'first_name', 'character varying', 'Candidate''s first name', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'first_name');
INSERT INTO public.dataset_columns VALUES ('e6b62527-d03e-44f1-97d9-951b7f9e56b9', '2c2cd754-7969-4e2c-8912-44329e528c5d', 'last_name', 'character varying', 'Candidate''s last name', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'last_name');
INSERT INTO public.dataset_columns VALUES ('dd2467e2-8d6a-4f73-8231-831f762782dc', '2c2cd754-7969-4e2c-8912-44329e528c5d', 'resume', 'xml', 'Candidate''s resume in XML format', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'xml', 'resume');
INSERT INTO public.dataset_columns VALUES ('4b310a48-ef1a-4bc6-b2a4-a58ed0e464ad', '2c2cd754-7969-4e2c-8912-44329e528c5d', 'modified_date', 'timestamp without time zone', 'Timestamp for when candidate record was modified', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('dff6dfdf-338b-48fe-a300-07294df463ee', '2c2cd754-7969-4e2c-8912-44329e528c5d', 'job_candidate_key', 'integer', 'Unique key identifier for job candidate', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'job_candidate_key');
INSERT INTO public.dataset_columns VALUES ('a81d93ca-f2fb-4be8-bf1f-491bb195bd52', '2c2cd754-7969-4e2c-8912-44329e528c5d', 'job_candidate_id', 'integer', 'ID assigned to job candidate', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'job_candidate_id');
INSERT INTO public.dataset_columns VALUES ('ad93ee44-8439-4b40-8e1d-e49d6e50029d', '2c2cd754-7969-4e2c-8912-44329e528c5d', 'fk_person', 'integer', 'Foreign key referencing the person entity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_person');
INSERT INTO public.dataset_columns VALUES ('fa478bf4-6bf4-4b5e-8e9a-168ef50765b9', '67e5062a-788d-4608-a05f-4d70b84f24cf', 'start_date', 'timestamp without time zone', 'Timestamp when the product cost history record becomes effective.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'start_date');
INSERT INTO public.dataset_columns VALUES ('530ac9b5-594d-46e9-85be-49e1d9506c3d', '67e5062a-788d-4608-a05f-4d70b84f24cf', 'end_date', 'timestamp without time zone', 'Timestamp when the product cost history record expires.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'end_date');
INSERT INTO public.dataset_columns VALUES ('11896b6b-1743-45d3-bd16-7c7f98b2197c', '67e5062a-788d-4608-a05f-4d70b84f24cf', 'modified_date', 'timestamp without time zone', 'Timestamp when the record was last updated.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('4f9191b0-a6e4-416e-81b9-82cc3f0009ae', '67e5062a-788d-4608-a05f-4d70b84f24cf', 'product_cost_history_key', 'integer', 'Unique key identifying the product cost history entry.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_cost_history_key');
INSERT INTO public.dataset_columns VALUES ('0623cc94-a164-40ed-bbc6-6cd7e751ff72', '67e5062a-788d-4608-a05f-4d70b84f24cf', 'product_id', 'integer', 'Identifier for the product associated with this cost history record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_id');
INSERT INTO public.dataset_columns VALUES ('2943b8ee-cc6c-4d0e-89f0-4c30aea438af', '67e5062a-788d-4608-a05f-4d70b84f24cf', 'standard_cost', 'numeric', 'Recorded standard cost for the product.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'standard_cost');
INSERT INTO public.dataset_columns VALUES ('ac133f67-6a19-402f-bc13-d4c083c1a03b', '32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'description', 'character varying', 'Text describing the details of the special offer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'description');
INSERT INTO public.dataset_columns VALUES ('4f83b9da-044d-441c-afe7-ee099cad2645', '32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'type', 'character varying', 'Text indicating the type of offer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'type');
INSERT INTO public.dataset_columns VALUES ('afa1d7f0-b085-4741-a2f6-625bb5dc5f0c', '32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'category', 'character varying', 'Text representing the category of the offer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'category');
INSERT INTO public.dataset_columns VALUES ('923c5118-3a54-48d2-ab7f-6dd4b49f3e98', '32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'start_date', 'timestamp without time zone', 'Timestamp when the offer starts.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'start_date');
INSERT INTO public.dataset_columns VALUES ('d2147d60-f547-4a6c-b84e-c222bc8e6ef4', '32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'end_date', 'timestamp without time zone', 'Timestamp when the offer ends.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'end_date');
INSERT INTO public.dataset_columns VALUES ('ef3ac8e7-7cdb-4fd6-8a47-353a488ecb09', '32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'modified_date', 'timestamp without time zone', 'Timestamp of the last modification to the offer details.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('9e3440fb-259e-4806-86dc-43b8d086f529', '32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'segment_discount_level', 'text', 'Text denoting the discount level based on segment criteria.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'text', 'segment_discount_level');
INSERT INTO public.dataset_columns VALUES ('64d87583-7315-481f-a615-d4f2c741f339', '32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'special_offer_key', 'integer', 'Unique key identifier for the special offer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'special_offer_key');
INSERT INTO public.dataset_columns VALUES ('e4d9a291-405e-4fd5-8f6e-04bc0e2d41cd', '32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'special_offer_id', 'integer', 'Identifier for the special offer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'special_offer_id');
INSERT INTO public.dataset_columns VALUES ('6c66215d-8cfd-45f5-90eb-e0f815ecb951', '32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'discount_pct', 'numeric', 'Sum of discount percentages applied in the offer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'discount_pct');
INSERT INTO public.dataset_columns VALUES ('f8176094-88d7-4e51-afa5-bc6a4381334f', '32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'min_qty', 'integer', 'Minimum quantity required for the offer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'min_qty');
INSERT INTO public.dataset_columns VALUES ('e5a44c41-e633-4e6b-ae52-35e36c0c0c08', '32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'max_qty', 'integer', 'Maximum quantity valid for the offer.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'max_qty');
INSERT INTO public.dataset_columns VALUES ('8102872d-3429-43d0-851c-1d417e3128a4', '55b4fb53-159c-4638-9136-745c2670143d', 'culture_id', 'character', 'Unique identifier representing the culture.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character', 'culture_id');
INSERT INTO public.dataset_columns VALUES ('fa7f4023-5e77-4a44-a941-ada7536023c4', '55b4fb53-159c-4638-9136-745c2670143d', 'name', 'character varying', 'The name of the culture.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('d55a9264-0de0-4f62-b728-264879b042b0', '55b4fb53-159c-4638-9136-745c2670143d', 'modified_date', 'timestamp without time zone', 'The timestamp marking when the record was last updated.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('d1ce2c3b-3881-40ff-9491-9a8a6c984a3f', '55b4fb53-159c-4638-9136-745c2670143d', 'culture_key', 'integer', 'The aggregation of culture keys for summarizing culture data.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'culture_key');
INSERT INTO public.dataset_columns VALUES ('9a1e46a5-b499-4cd8-80f4-eb6018aaba22', '0b0f0ceb-1e0f-428b-bfd5-cc8aa8bd612b', 'first_name', 'character varying', 'The given name of the person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'first_name');
INSERT INTO public.dataset_columns VALUES ('0832005a-3997-4772-bc9b-73f3342c01d1', '0b0f0ceb-1e0f-428b-bfd5-cc8aa8bd612b', 'last_name', 'character varying', 'The family name or surname of the person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'last_name');
INSERT INTO public.dataset_columns VALUES ('d6d75cb1-defb-430c-8e99-459350f8f0af', '0b0f0ceb-1e0f-428b-bfd5-cc8aa8bd612b', 'title', 'character varying', 'The professional title or honorific of the person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'title');
INSERT INTO public.dataset_columns VALUES ('437f9a57-6172-4271-93ba-eb6dcf3ff065', '0b0f0ceb-1e0f-428b-bfd5-cc8aa8bd612b', 'email_address', 'character varying', 'The email address of the person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'email_address');
INSERT INTO public.dataset_columns VALUES ('216c58fb-76a2-41c0-8973-f2e65699982f', '0b0f0ceb-1e0f-428b-bfd5-cc8aa8bd612b', 'phone_number', 'character varying', 'The contact phone number of the person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'phone_number');
INSERT INTO public.dataset_columns VALUES ('a4273091-f8e5-400b-b8d0-17efee0a1b05', '0b0f0ceb-1e0f-428b-bfd5-cc8aa8bd612b', 'segment_recent_update', 'text', 'A textual segment indicating recent changes', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'text', 'segment_recent_update');
INSERT INTO public.dataset_columns VALUES ('4159e082-2094-47a1-8167-14fa5ae1ad7b', '0b0f0ceb-1e0f-428b-bfd5-cc8aa8bd612b', 'modified_date', 'timestamp without time zone', 'The timestamp when the record was last updated', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('1cc189d4-18e8-4ae8-ab8d-9f357fa9e3d9', '0b0f0ceb-1e0f-428b-bfd5-cc8aa8bd612b', 'person_key', 'integer', 'A unique key identifier for the person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'person_key');
INSERT INTO public.dataset_columns VALUES ('01777da5-a155-4f5f-be6e-a4b2ba38c693', '0b0f0ceb-1e0f-428b-bfd5-cc8aa8bd612b', 'fk_business_entity', 'integer', 'A foreign key referencing the associated business entity', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_business_entity');
INSERT INTO public.dataset_columns VALUES ('6e726425-fd3f-428e-86a4-b0b04bc23e71', '45cc0bcb-a906-4505-9337-1cfb59b9e71c', 'department_name', 'character varying', 'The name of the department within the organization', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'department_name');
INSERT INTO public.dataset_columns VALUES ('78b09bac-9129-43d2-b465-3cdc2e563180', '45cc0bcb-a906-4505-9337-1cfb59b9e71c', 'group_name', 'character varying', 'The name of the group associated with the department', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'group_name');
INSERT INTO public.dataset_columns VALUES ('42c61362-7f33-4284-b2d9-248cde18ef0d', '45cc0bcb-a906-4505-9337-1cfb59b9e71c', 'modified_date', 'timestamp without time zone', 'The date and time when the department record was last updated', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('90d215db-1f39-4b6d-ac91-f0643b87fbdb', '45cc0bcb-a906-4505-9337-1cfb59b9e71c', 'department_key', 'integer', 'A unique key identifier for the department, used for aggregation', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'department_key');
INSERT INTO public.dataset_columns VALUES ('b85e2cbe-7efc-4d33-8811-490e2a75347b', '45cc0bcb-a906-4505-9337-1cfb59b9e71c', 'department_id', 'integer', 'The identifier for the department used in system records', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'department_id');
INSERT INTO public.dataset_columns VALUES ('d0345501-1bf4-4bc4-8f4e-704d16ffe892', '45cc0bcb-a906-4505-9337-1cfb59b9e71c', 'employee_count', 'bigint', 'The total number of employees in the department', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'bigint', 'employee_count');
INSERT INTO public.dataset_columns VALUES ('d0beff55-731b-4b78-8657-96380c80f000', '12da0036-fee2-4724-9124-53f8540c0f57', 'thumbnail_photo', 'bytea', 'Photo stored as bytea for thumbnail representation.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'bytea', 'thumbnail_photo');
INSERT INTO public.dataset_columns VALUES ('968ebaea-3500-49b0-a0e4-8dc7e5f9df6a', '12da0036-fee2-4724-9124-53f8540c0f57', 'thumbnail_photo_file_name', 'character varying', 'Filename for the thumbnail photo.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'thumbnail_photo_file_name');
INSERT INTO public.dataset_columns VALUES ('4e5618b5-3f7f-4796-b38f-0b28838f9c13', '12da0036-fee2-4724-9124-53f8540c0f57', 'large_photo', 'bytea', 'Photo stored as bytea for large representation.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'bytea', 'large_photo');
INSERT INTO public.dataset_columns VALUES ('03e00619-969c-42f8-9ce4-8080ca5ab27e', '12da0036-fee2-4724-9124-53f8540c0f57', 'large_photo_file_name', 'character varying', 'Filename for the large photo.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'large_photo_file_name');
INSERT INTO public.dataset_columns VALUES ('1e86c13b-9d22-4376-865e-fd2eb497b192', '12da0036-fee2-4724-9124-53f8540c0f57', 'modified_date', 'timestamp without time zone', 'Timestamp indicating when the photo was last modified.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('1406fad1-a308-45e6-940b-d6712fc32556', '12da0036-fee2-4724-9124-53f8540c0f57', 'product_photo_key', 'integer', 'Unique numeric key representing the photo entry for aggregation.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_photo_key');
INSERT INTO public.dataset_columns VALUES ('e74eded1-8676-40d2-887d-d9d4d04541ea', '12da0036-fee2-4724-9124-53f8540c0f57', 'product_photo_id', 'integer', 'Unique identifier for the photo used in aggregations.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'product_photo_id');
INSERT INTO public.dataset_columns VALUES ('017d0d3f-c537-425a-83e1-9444567c0f6d', '2e28469d-47a4-425e-bdd7-07356e1214d8', 'quota_date', 'timestamp without time zone', 'The date on which the sales quota was applied or recorded', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'quota_date');
INSERT INTO public.dataset_columns VALUES ('e0530b53-b344-4cd6-adca-9093206c0057', '2e28469d-47a4-425e-bdd7-07356e1214d8', 'rowguid', 'uuid', 'Unique identifier for the record', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'uuid', 'rowguid');
INSERT INTO public.dataset_columns VALUES ('368774a9-9d22-45a8-a689-f5f3689cb4c3', '2e28469d-47a4-425e-bdd7-07356e1214d8', 'modified_date', 'timestamp without time zone', 'Timestamp when the record was last modified', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('23ee8f29-3e5e-48e5-b619-9fc4a4dca5d4', '2e28469d-47a4-425e-bdd7-07356e1214d8', 'sales_person_quota_history_key', 'integer', 'Primary key for the sales quota history record', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_person_quota_history_key');
INSERT INTO public.dataset_columns VALUES ('29cf4e1a-64fb-4be5-bed8-0d90015f03ea', '2e28469d-47a4-425e-bdd7-07356e1214d8', 'business_entity_id', 'integer', 'Identifier for the business entity associated with the sales person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'business_entity_id');
INSERT INTO public.dataset_columns VALUES ('ab1730f4-be81-4d6a-bd4f-7fb757457a69', '2e28469d-47a4-425e-bdd7-07356e1214d8', 'sales_quota', 'numeric', 'The allocated sales quota amount for the sales person', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'sales_quota');
INSERT INTO public.dataset_columns VALUES ('92bb342e-ca90-4576-85d7-bb7ccdbfaa81', 'b72ef391-fcb0-4b8f-91fb-675a4052d9b0', 'name', 'character varying', 'The name of the contact type', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('fa7384ac-ea5b-4228-a644-e065b249962d', 'b72ef391-fcb0-4b8f-91fb-675a4052d9b0', 'modified_date', 'timestamp without time zone', 'The date when the record was last modified', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('d4967356-0ef2-4b46-b6af-4d511c76360f', 'b72ef391-fcb0-4b8f-91fb-675a4052d9b0', 'contact_type_key', 'integer', 'Aggregated key identifying the contact type', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'contact_type_key');
INSERT INTO public.dataset_columns VALUES ('262c07be-07a0-4e03-9e59-e44df14f3b75', 'b72ef391-fcb0-4b8f-91fb-675a4052d9b0', 'contact_type_id', 'integer', 'Aggregated identifier for the contact type', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'contact_type_id');
INSERT INTO public.dataset_columns VALUES ('cadeda04-99cd-45a0-bb20-8aa081d91995', '8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'name', 'character varying', 'Name of the vendor', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('e001d12f-357e-4d7d-a485-7a5179f195d8', '8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'preferred_vendor_status', 'boolean', 'Indicates if the vendor is preferred', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'boolean', 'preferred_vendor_status');
INSERT INTO public.dataset_columns VALUES ('cbefdcd3-47fc-4266-88ba-6bd2efd9cbd6', '8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'active_flag', 'boolean', 'Status flag representing if the vendor is currently active', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'boolean', 'active_flag');
INSERT INTO public.dataset_columns VALUES ('0d7891c3-4bf2-44c0-85e3-e35b66793046', '8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'email_address', 'character varying', 'Contact email address for the vendor', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'email_address');
INSERT INTO public.dataset_columns VALUES ('01f19435-b994-408e-a49a-328b831b3840', '8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'modified_date', 'timestamp without time zone', 'The date and time when the vendor record was last modified', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('fcb14fa3-31c5-45f7-8e20-ae4709c554df', '8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'segment_vendor_rating', 'text', 'Rating of vendor segment based on performance metrics', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'text', 'segment_vendor_rating');
INSERT INTO public.dataset_columns VALUES ('b300385f-a71a-4ec5-a60c-143197462b22', '8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'vendor_key', 'integer', 'Unique key identifier for the vendor', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'vendor_key');
INSERT INTO public.dataset_columns VALUES ('f5dd4c2d-d36c-456c-ba2e-90674b0d63d3', '8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'fk_person', 'integer', 'Foreign key linking to the person entity associated with the vendor', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_person');
INSERT INTO public.dataset_columns VALUES ('b30def7b-a614-4cf6-9ea0-ff41b2fa59c3', '8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'credit_rating', 'smallint', 'Credit rating score assigned to the vendor', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'smallint', 'credit_rating');
INSERT INTO public.dataset_columns VALUES ('458037c8-bbff-4ed4-b3bd-d35d7f3f7237', '8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'average_lead_time', 'numeric', 'Average lead time for vendor deliveries', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'average_lead_time');
INSERT INTO public.dataset_columns VALUES ('421dea16-f8b1-47bf-bff2-e470cdeedb1d', '8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'total_purchase_orders_last_12_months', 'bigint', 'Total number of purchase orders placed in the last 12 months', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'bigint', 'total_purchase_orders_last_12_months');
INSERT INTO public.dataset_columns VALUES ('26f85fde-bb0a-4eee-8137-a4c8594eb8b7', '8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'total_purchase_cost_last_12_months', 'numeric', 'Aggregate cost of purchases made in the last 12 months', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'total_purchase_cost_last_12_months');
INSERT INTO public.dataset_columns VALUES ('15d7420f-d032-4164-b889-9f641ecb0e7f', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'order_date', 'timestamp without time zone', 'The date when the order was placed.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'order_date');
INSERT INTO public.dataset_columns VALUES ('d7e0079a-610f-40a3-b78f-af4077fb1810', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'due_date', 'timestamp without time zone', 'The expected date for order delivery.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'due_date');
INSERT INTO public.dataset_columns VALUES ('8ab15d43-87f1-4e4f-bb5f-cf37f8eee7de', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'ship_date', 'timestamp without time zone', 'The date when the order was shipped.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'ship_date');
INSERT INTO public.dataset_columns VALUES ('8e69197f-146f-46e2-9097-0d7313470414', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'product_name', 'character varying', 'The name of the product ordered.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'product_name');
INSERT INTO public.dataset_columns VALUES ('c2e9adf7-2aa4-4157-8a9f-a895e98783c6', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'territory_name', 'character varying', 'The name of the sales territory associated with the order.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'territory_name');
INSERT INTO public.dataset_columns VALUES ('cf94f7ed-ed23-44f2-bf2e-f5d2bbcf4041', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'modified_date', 'timestamp without time zone', 'The date when the order record was last modified.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('311a4af3-8fa4-4904-8bf7-928a83277c47', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'segment_recent_order', 'text', 'A segment identifier indicating recent order status.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'text', 'segment_recent_order');
INSERT INTO public.dataset_columns VALUES ('0909ac3c-0f6d-4c1e-972b-e71d6a44875f', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'sales_key', 'integer', 'The aggregated sum of sales key values, uniquely identifying sales transactions.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_key');
INSERT INTO public.dataset_columns VALUES ('66439729-f6d7-479b-9a6e-3e7080468a6b', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'sales_order_id', 'integer', 'The aggregated sum of sales order IDs for reporting purposes.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_order_id');
INSERT INTO public.dataset_columns VALUES ('a24e548d-3378-4d94-b3cb-5b85fe5454f0', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'fk_customer', 'integer', 'The aggregated foreign key linking to customer records.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_customer');
INSERT INTO public.dataset_columns VALUES ('b2cf4552-a749-4126-a588-46f07b13e496', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'customer_id', 'integer', 'The aggregated sum of customer IDs associated with the orders.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'customer_id');
INSERT INTO public.dataset_columns VALUES ('a0328d2a-b15a-4a10-b63d-01c0a09ee328', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'fk_product', 'integer', 'The aggregated foreign key linking to product records.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_product');
INSERT INTO public.dataset_columns VALUES ('1adac669-9b37-4839-b213-4736bf691522', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'order_qty', 'smallint', 'The total quantity of items ordered aggregated across orders.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'smallint', 'order_qty');
INSERT INTO public.dataset_columns VALUES ('f40d9c21-3d42-4644-98b9-9ec176ae8fb5', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'unit_price', 'numeric', 'The aggregated sum of unit prices for the ordered products.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'unit_price');
INSERT INTO public.dataset_columns VALUES ('4b8cee4c-5ae8-48bd-80c1-1592ea2781d9', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'unit_price_discount', 'numeric', 'The aggregated sum of discounts applied to the unit prices.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'unit_price_discount');
INSERT INTO public.dataset_columns VALUES ('ded956fd-cfb9-4b61-946e-f46d85eaedb3', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'line_total', 'numeric', 'The total sum of line totals, representing order value after discounts.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'line_total');
INSERT INTO public.dataset_columns VALUES ('46e045b0-f126-48b2-b7da-13414f4e770b', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'fk_sales_person', 'integer', 'The aggregated foreign key identifying the sales person associated with the sale.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_sales_person');
INSERT INTO public.dataset_columns VALUES ('909f2b5b-88ad-419c-9215-dba2da77406e', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'business_entity_id', 'integer', 'The aggregated identifier linking to the business entity responsible for the sale.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'business_entity_id');
INSERT INTO public.dataset_columns VALUES ('834c3a0e-ff8b-42af-a381-6109e797ea01', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'fk_territory', 'integer', 'The aggregated foreign key linking to the sales territory record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_territory');
INSERT INTO public.dataset_columns VALUES ('8294adbd-1a55-41a3-913c-c996ffee65c4', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'fk_bill_to_address', 'integer', 'The aggregated foreign key linking to the billing address record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_bill_to_address');
INSERT INTO public.dataset_columns VALUES ('20653185-bebe-4269-a121-b87cde1fd553', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'fk_ship_to_address', 'integer', 'The aggregated foreign key linking to the shipping address record.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_ship_to_address');
INSERT INTO public.dataset_columns VALUES ('7487b304-6125-47e5-982d-b35c829512dc', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'days_to_ship', 'numeric', 'The total aggregated count of days taken to ship the orders.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'days_to_ship');
INSERT INTO public.dataset_columns VALUES ('e19be221-9b98-4122-8ed2-d9ee0a4c1216', '9fa460b4-1410-4e74-aa34-eb79027cd59c', 'delivery_delay', 'numeric', 'The aggregated sum of delays between the expected delivery date and the actual ship date.', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'numeric', 'delivery_delay');
INSERT INTO public.dataset_columns VALUES ('15b7c4f3-dfdf-4c25-b207-cd73b1c1349a', '92b226a7-4255-47ec-83a1-499255a09fe7', 'name', 'character varying', 'Unique identifier for the store name', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'character varying', 'name');
INSERT INTO public.dataset_columns VALUES ('41b38c6f-f64f-436d-8782-ecc0328b5826', '92b226a7-4255-47ec-83a1-499255a09fe7', 'demographics', 'xml', 'XML containing demographic details about the store', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'xml', 'demographics');
INSERT INTO public.dataset_columns VALUES ('0198b02e-f731-4e8b-bbb7-a0592f5f20b8', '92b226a7-4255-47ec-83a1-499255a09fe7', 'rowguid', 'uuid', 'Unique identifier for each record row', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'uuid', 'rowguid');
INSERT INTO public.dataset_columns VALUES ('1290285c-f29f-47a9-a22c-c416008fa8ee', '92b226a7-4255-47ec-83a1-499255a09fe7', 'modified_date', 'timestamp without time zone', 'Timestamp marking the date of the last modification', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'dimension', 'timestamp without time zone', 'modified_date');
INSERT INTO public.dataset_columns VALUES ('d27f97de-a2a2-42e3-87f6-ae6f91eff46c', '92b226a7-4255-47ec-83a1-499255a09fe7', 'store_key', 'integer', 'Aggregated sum representing the unique store key', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'store_key');
INSERT INTO public.dataset_columns VALUES ('4522a2c6-4097-4643-a362-4efe3525acfb', '92b226a7-4255-47ec-83a1-499255a09fe7', 'fk_person', 'integer', 'Aggregated sum for foreign key references to person entries', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'fk_person');
INSERT INTO public.dataset_columns VALUES ('8a61f3e8-af13-402e-8bf5-af55f8e6ca12', '92b226a7-4255-47ec-83a1-499255a09fe7', 'sales_person_id', 'integer', 'Aggregated sum for the sales person identifier', true, '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, false, NULL, NULL, NULL, NULL, 'measure', 'integer', 'sales_person_id');


--
-- Data for Name: dataset_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: dataset_groups_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: datasets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.datasets VALUES ('f4298ca8-9e61-4e88-b958-59975a06bcec', 'entity_transaction_history_archive', 'entity_transaction_history_archive', 'Generated model for entity_transaction_history_archive', NULL, 'view', '/* entity_transaction_history_archive */
DROP TABLE IF EXISTS sem.entity_transaction_history_archive CASCADE;
CREATE TABLE sem.entity_transaction_history_archive AS
SELECT 
    tha.transaction_history_archive_key,
    tha.transaction_id,
    tha.product_id,
    tha.reference_order_id,
    tha.reference_order_line_id,
    tha.transaction_date,
    tha.transaction_type,
    tha.quantity,
    tha.actual_cost,
    tha.modified_date
FROM dw.fact_transaction_history_archive tha; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_transaction_history_archive
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_transaction_history_archive
  model: null
  entities:
  - name: entity_product
    ref_: null
    expr: product_id
    type: foreign
    description: Reference to the product
    project_path: null
  - name: entity_sales_order
    ref_: null
    expr: reference_order_id
    type: foreign
    description: Reference to the sales order
    project_path: null
  dimensions:
  - name: transaction_date
    expr: transaction_date
    type: timestamp without time zone
    description: The date and time when the transaction occurred.
    searchable: false
  - name: transaction_type
    expr: transaction_type
    type: character
    description: The type or classification of the transaction.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp indicating the last modification date of the record.
    searchable: false
  measures:
  - name: transaction_history_archive_key
    expr: transaction_history_archive_key
    agg: sum
    description: Unique key identifier for archived transaction history records.
    type: integer
  - name: transaction_id
    expr: transaction_id
    agg: sum
    description: Unique identifier for the transaction.
    type: integer
  - name: product_id
    expr: product_id
    agg: sum
    description: Identifier for the product involved in the transaction.
    type: integer
  - name: reference_order_id
    expr: reference_order_id
    agg: sum
    description: Identifier for the associated order.
    type: integer
  - name: reference_order_line_id
    expr: reference_order_line_id
    agg: sum
    description: Identifier for the specific order line in the associated order.
    type: integer
  - name: quantity
    expr: quantity
    agg: sum
    description: The count of products involved in the transaction.
    type: integer
  - name: actual_cost
    expr: actual_cost
    agg: sum
    description: The actual cost incurred in the transaction.
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('5ff9b5f5-096b-48a6-b217-a0fe520f5962', 'entity_sales_reason', 'entity_sales_reason', 'Generated model for entity_sales_reason', NULL, 'view', '/* entity_sales_reason */
DROP TABLE IF EXISTS sem.entity_sales_reason CASCADE;
CREATE TABLE sem.entity_sales_reason AS
SELECT 
    sr.sales_reason_key,
    sr.sales_reason_id,
    sr.name,
    sr.reason_type,
    sr.modified_date
FROM dw.dim_sales_reason sr; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_sales_reason
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_sales_reason
  model: null
  entities: []
  dimensions:
  - name: name
    expr: name
    type: character varying
    description: The name of the sales reason entity.
    searchable: false
  - name: reason_type
    expr: reason_type
    type: character varying
    description: The classification type indicating the nature of the sales reason.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date and time when the sales reason entity was last modified.
    searchable: false
  measures:
  - name: sales_reason_key
    expr: sales_reason_key
    agg: sum
    description: The key identifier for aggregating sales reason data.
    type: integer
  - name: sales_reason_id
    expr: sales_reason_id
    agg: sum
    description: The unique identifier for sales reason instances used in aggregation.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('e9d9b89e-d070-4bea-8f28-65045c84e7e1', 'entity_product', 'entity_product', 'Generated model for entity_product', NULL, 'view', '/* entity_product */
DROP TABLE IF EXISTS sem.entity_product CASCADE;
CREATE TABLE sem.entity_product AS
SELECT 
    p.product_key,
    p.product_id,
    p.name,
    p.product_number,
    p.color,
    p.standard_cost,
    p.list_price,
    cat.name AS product_category,
    subcat.name AS product_subcategory,
    pm.name AS product_model,
    pli.list_price AS current_list_price,
    inv.quantity AS inventory_quantity,
    pr.avg_rating,
    p.sell_start_date,
    p.sell_end_date,
    p.modified_date,
    CASE WHEN p.list_price > 1000 THEN ''High Value''
         ELSE ''Standard'' END AS segment_product_value,
    (
     SELECT COALESCE(SUM(s.order_qty),0) FROM dw.fact_sales s 
     WHERE s.product_key = p.product_id 
       AND s.order_date >= CURRENT_DATE - INTERVAL ''12 months''
    ) AS total_units_sold_last_12_months,
    (
     SELECT COALESCE(SUM(s.line_total),0) FROM dw.fact_sales s 
     WHERE s.product_key = p.product_id 
       AND s.order_date >= CURRENT_DATE - INTERVAL ''12 months''
    ) AS total_product_revenue_last_12_months
FROM dw.dim_product p
LEFT JOIN dw.dim_product_subcategory subcat
    ON p.product_subcategory_id = subcat.product_subcategory_id
LEFT JOIN dw.dim_product_category cat
    ON subcat.product_category_id = cat.product_category_id
LEFT JOIN dw.dim_product_model pm
    ON p.product_model_id = pm.product_model_id
LEFT JOIN (
    SELECT product_id, MAX(list_price) AS list_price
    FROM dw.fact_product_list_price_history
    GROUP BY product_id
) pli
    ON p.product_id = pli.product_id
LEFT JOIN (
    SELECT product_id, SUM(quantity) AS quantity
    FROM dw.fact_product_inventory
    GROUP BY product_id
) inv
    ON p.product_id = inv.product_id
LEFT JOIN (
    SELECT product_id, AVG(rating) AS avg_rating
    FROM dw.fact_product_review
    GROUP BY product_id
) pr
    ON p.product_id = pr.product_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_product
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_product
  model: null
  entities: []
  dimensions:
  - name: name
    expr: name
    type: character varying
    description: The name of the product
    searchable: false
  - name: product_number
    expr: product_number
    type: character varying
    description: The unique product identification number
    searchable: false
  - name: color
    expr: color
    type: character varying
    description: The color of the product
    searchable: false
  - name: product_category
    expr: product_category
    type: character varying
    description: The main category to which the product belongs
    searchable: false
  - name: product_subcategory
    expr: product_subcategory
    type: character varying
    description: The subcategory classification for the product
    searchable: false
  - name: product_model
    expr: product_model
    type: character varying
    description: The model identifier for the product
    searchable: false
  - name: sell_start_date
    expr: sell_start_date
    type: timestamp without time zone
    description: The date when the product became available for sale
    searchable: false
  - name: sell_end_date
    expr: sell_end_date
    type: timestamp without time zone
    description: The date when the product was discontinued from sale
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date when the product details were last updated
    searchable: false
  - name: segment_product_value
    expr: segment_product_value
    type: text
    description: Descriptive segment that categorizes product value
    searchable: false
  measures:
  - name: product_key
    expr: product_key
    agg: sum
    description: A unique key used to identify the product record
    type: integer
  - name: product_id
    expr: product_id
    agg: sum
    description: A unique numeric identifier for the product
    type: integer
  - name: standard_cost
    expr: standard_cost
    agg: sum
    description: The standard cost to produce or procure the product
    type: numeric
  - name: list_price
    expr: list_price
    agg: sum
    description: The retail list price of the product
    type: numeric
  - name: current_list_price
    expr: current_list_price
    agg: sum
    description: The current effective retail price of the product
    type: numeric
  - name: inventory_quantity
    expr: inventory_quantity
    agg: sum
    description: The total quantity available in inventory
    type: bigint
  - name: avg_rating
    expr: avg_rating
    agg: sum
    description: The average customer rating for the product
    type: numeric
  - name: total_units_sold_last_12_months
    expr: total_units_sold_last_12_months
    agg: sum
    description: Total number of product units sold in the last 12 months
    type: bigint
  - name: total_product_revenue_last_12_months
    expr: total_product_revenue_last_12_months
    agg: sum
    description: Total revenue generated by the product in the last 12 months
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('222e07e9-5212-4a87-b8eb-4bd4f02cca62', 'entity_phone_number_type', 'entity_phone_number_type', 'Generated model for entity_phone_number_type', NULL, 'view', '/* entity_phone_number_type */
DROP TABLE IF EXISTS sem.entity_phone_number_type CASCADE;
CREATE TABLE sem.entity_phone_number_type AS
SELECT 
    phone_number_type_key,
    phone_number_type_id,
    name,
FROM dw.dim_phone_number_type; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_phone_number_type
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_phone_number_type
  model: null
  entities: []
  dimensions:
  - name: name
    expr: name
    type: character varying
    description: The name of the phone number type.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date when the record was last modified.
    searchable: false
  measures:
  - name: phone_number_type_key
    expr: phone_number_type_key
    agg: sum
    description: A unique key identifier for the phone number type.
    type: integer
  - name: phone_number_type_id
    expr: phone_number_type_id
    agg: sum
    description: The identifier associated with the phone number type.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('40fc4d7f-0035-4597-9173-7b72a5e6bdde', 'entity_currency_rate', 'entity_currency_rate', 'Generated model for entity_currency_rate', NULL, 'view', '/* entity_currency_rate */
DROP TABLE IF EXISTS sem.entity_currency_rate CASCADE;
CREATE TABLE sem.entity_currency_rate AS
SELECT 
    cr.currency_rate_key,
    cr.currency_rate_id,
    cr.currency_rate_date,
    cr.from_currency_code,
    cr.to_currency_code,
    cr.average_rate,
    cr.end_of_day_rate,
    cr.modified_date
FROM dw.fact_currency_rate cr; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_currency_rate
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_currency_rate
  model: null
  entities:
  - name: entity_currency
    ref_: null
    expr: from_currency_code
    type: foreign
    description: Reference to the source currency
    project_path: null
  - name: entity_currency
    ref_: null
    expr: to_currency_code
    type: foreign
    description: Reference to the target currency
    project_path: null
  dimensions:
  - name: currency_rate_date
    expr: currency_rate_date
    type: timestamp without time zone
    description: Date of the currency exchange rate. Represents the specific day the rate was recorded.
    searchable: false
  - name: from_currency_code
    expr: from_currency_code
    type: character
    description: Currency code representing the source currency.
    searchable: false
  - name: to_currency_code
    expr: to_currency_code
    type: character
    description: Currency code representing the target currency.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp of the last modification to the record.
    searchable: false
  measures:
  - name: currency_rate_key
    expr: currency_rate_key
    agg: sum
    description: Unique key identifier for the currency rate record.
    type: integer
  - name: currency_rate_id
    expr: currency_rate_id
    agg: sum
    description: Identifier for the currency rate.
    type: integer
  - name: average_rate
    expr: average_rate
    agg: sum
    description: The average exchange rate calculated for the day.
    type: numeric
  - name: end_of_day_rate
    expr: end_of_day_rate
    agg: sum
    description: The final exchange rate recorded at the end of the day.
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('16a38e0e-5699-43a7-addf-1cbf8bafdea7', 'entity_country_region', 'entity_country_region', 'Generated model for entity_country_region', NULL, 'view', '/* entity_country_region */
/* entity_country_region */
DROP TABLE IF EXISTS sem.entity_country_region CASCADE;
CREATE TABLE sem.entity_country_region AS
SELECT 
    country_region_key,
    country_region_code,
    name,
    modified_date
FROM dw.dim_country_region; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_country_region
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_country_region
  model: null
  entities: []
  dimensions:
  - name: country_region_code
    expr: country_region_code
    type: character varying
    description: The unique code representing a country or region.
    searchable: false
  - name: name
    expr: name
    type: character varying
    description: The name of the country or region.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date and time when the record was last updated.
    searchable: false
  measures:
  - name: country_region_key
    expr: country_region_key
    agg: sum
    description: Identifier key used for aggregating country or region data.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('eeb0ca19-e3cf-4d83-9761-f175a9fbbedc', 'entity_country_region_currency', 'entity_country_region_currency', 'Generated model for entity_country_region_currency', NULL, 'view', '/* entity_country_region_currency */
DROP TABLE IF EXISTS sem.entity_country_region_currency CASCADE;
CREATE TABLE sem.entity_country_region_currency AS
SELECT 
    crc.bridge_country_region_currency_key,
    crc.country_region_code,
    crc.currency_code,
    crc.modified_date
FROM dw.bridge_country_region_currency crc; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_country_region_currency
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_country_region_currency
  model: null
  entities:
  - name: entity_country_region
    ref_: null
    expr: country_region_code
    type: foreign
    description: Reference to the country/region
    project_path: null
  - name: entity_currency
    ref_: null
    expr: currency_code
    type: foreign
    description: Reference to the currency
    project_path: null
  dimensions:
  - name: country_region_code
    expr: country_region_code
    type: character varying
    description: Unique code representing the country and region.
    searchable: false
  - name: currency_code
    expr: currency_code
    type: character
    description: Currency identifier code corresponding to the country/region.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp when the record was last modified.
    searchable: false
  measures:
  - name: bridge_country_region_currency_key
    expr: bridge_country_region_currency_key
    agg: sum
    description: Aggregated key linking country, region, and currency.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('bcab71b8-a432-4e8b-9b7f-9cca1709f9a4', 'entity_business_entity', 'entity_business_entity', 'Generated model for entity_business_entity', NULL, 'view', '/* entity_business_entity */
/* entity_business_entity */
DROP TABLE IF EXISTS sem.entity_business_entity CASCADE;
CREATE TABLE sem.entity_business_entity AS
SELECT 
    business_entity_key,
    business_entity_id,
    rowguid,
    modified_date
FROM dw.dim_business_entity; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_business_entity
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_business_entity
  model: null
  entities: []
  dimensions:
  - name: rowguid
    expr: rowguid
    type: uuid
    description: A unique identifier for each entity row, ensuring data integrity.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The timestamp when the record was last updated, useful for tracking changes.
    searchable: false
  measures:
  - name: business_entity_key
    expr: business_entity_key
    agg: sum
    description: The cumulative sum of business entity keys, representing aggregated identifier data.
    type: integer
  - name: business_entity_id
    expr: business_entity_id
    agg: sum
    description: The cumulative sum of business entity IDs, useful for summarizing entity counts.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('c4f322cc-ebe8-41d8-a929-d4723ec826b3', 'entity_shopping_cart_item', 'entity_shopping_cart_item', 'Generated model for entity_shopping_cart_item', NULL, 'view', '/* entity_shopping_cart_item */
DROP TABLE IF EXISTS sem.entity_shopping_cart_item CASCADE;
CREATE TABLE sem.entity_shopping_cart_item AS
SELECT 
    sci.shopping_cart_item_key,
    sci.shopping_cart_item_id,
    sci.shopping_cart_id,
    sci.quantity,
    sci.product_id,
    sci.date_created,
    sci.modified_date
FROM dw.fact_shopping_cart_item sci; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_shopping_cart_item
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_shopping_cart_item
  model: null
  entities:
  - name: entity_product
    ref_: null
    expr: product_id
    type: foreign
    description: Reference to the product
    project_path: null
  dimensions:
  - name: shopping_cart_id
    expr: shopping_cart_id
    type: character varying
    description: Unique identifier for the shopping cart.
    searchable: false
  - name: date_created
    expr: date_created
    type: timestamp without time zone
    description: Timestamp marking when the shopping cart item was created.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp indicating the last time the shopping cart item was modified.
    searchable: false
  measures:
  - name: shopping_cart_item_key
    expr: shopping_cart_item_key
    agg: sum
    description: Summarizes unique keys of shopping cart items for aggregation purposes.
    type: integer
  - name: shopping_cart_item_id
    expr: shopping_cart_item_id
    agg: sum
    description: Aggregates the unique identifiers of each shopping cart item.
    type: integer
  - name: quantity
    expr: quantity
    agg: sum
    description: Total quantity of the product captured in the shopping cart item.
    type: integer
  - name: product_id
    expr: product_id
    agg: sum
    description: Aggregated identifier for the product associated with the shopping cart item.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('cca26df0-c191-487a-a3fd-71496f96359f', 'entity_bill_of_materials', 'entity_bill_of_materials', 'Generated model for entity_bill_of_materials', NULL, 'view', '/* entity_bill_of_materials */
DROP TABLE IF EXISTS sem.entity_bill_of_materials CASCADE;
CREATE TABLE sem.entity_bill_of_materials AS
SELECT 
    bom.bom_key,
    bom.bill_of_materials_id,
    bom.product_assembly_id AS fk_assembly,
    pa.name AS assembly_name,
    bom.component_id AS fk_component,
    pc.name AS component_name,
    bom.start_date,
    bom.end_date,
    bom.unit_measure_code,
    bom.bom_level,
    bom.per_assembly_qty,
    bom.modified_date
FROM dw.fact_bill_of_materials bom
LEFT JOIN dw.dim_product pa
    ON bom.product_assembly_id = pa.product_id
LEFT JOIN dw.dim_product pc
    ON bom.component_id = pc.product_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_bill_of_materials
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_bill_of_materials
  model: null
  entities:
  - name: entity_product
    ref_: null
    expr: fk_assembly
    type: foreign
    description: Reference to the product assembly
    project_path: null
  - name: entity_product
    ref_: null
    expr: fk_component
    type: foreign
    description: Reference to the product component
    project_path: null
  dimensions:
  - name: assembly_name
    expr: assembly_name
    type: character varying
    description: Name of the assembly in the bill of materials record
    searchable: false
  - name: component_name
    expr: component_name
    type: character varying
    description: Name for the component included in the assembly
    searchable: false
  - name: start_date
    expr: start_date
    type: timestamp without time zone
    description: The start date when the assembly component relationship becomes valid
    searchable: false
  - name: end_date
    expr: end_date
    type: timestamp without time zone
    description: The end date when the assembly component relationship expires
    searchable: false
  - name: unit_measure_code
    expr: unit_measure_code
    type: character
    description: Code representing the unit of measure for component quantity
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp indicating the last modification date of the record
    searchable: false
  measures:
  - name: bom_key
    expr: bom_key
    agg: sum
    description: Unique key identifying the bill of materials record
    type: integer
  - name: bill_of_materials_id
    expr: bill_of_materials_id
    agg: sum
    description: Identifier for the bill of materials entry
    type: integer
  - name: fk_assembly
    expr: fk_assembly
    agg: sum
    description: Foreign key linking to the assembly entity
    type: integer
  - name: fk_component
    expr: fk_component
    agg: sum
    description: Foreign key linking to the component entity
    type: integer
  - name: bom_level
    expr: bom_level
    agg: sum
    description: Level of the component within the assembly hierarchy
    type: smallint
  - name: per_assembly_qty
    expr: per_assembly_qty
    agg: sum
    description: Quantity of the component required per assembly
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('5114cd6f-71b2-4843-8354-ddf0746ec22d', 'entity_illustration', 'entity_illustration', 'Generated model for entity_illustration', NULL, 'view', '/* entity_illustration */
DROP TABLE IF EXISTS sem.entity_illustration CASCADE;
CREATE TABLE sem.entity_illustration AS
SELECT 
    i.illustration_key,
    i.illustration_id,
    i.diagram,
    i.modified_date
FROM dw.dim_illustration i; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_illustration
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_illustration
  model: null
  entities: []
  dimensions:
  - name: diagram
    expr: diagram
    type: xml
    description: XML representation of the diagram for the entity illustration
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp indicating when the entity illustration was last modified
    searchable: false
  measures:
  - name: illustration_key
    expr: illustration_key
    agg: sum
    description: Unique key associated with the illustration for aggregate computations
    type: integer
  - name: illustration_id
    expr: illustration_id
    agg: sum
    description: Unique identifier used for the illustration
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('129a0d01-a139-471d-af2e-627ee136369c', 'entity_document', 'entity_document', 'Generated model for entity_document', NULL, 'view', '/* entity_document */
DROP TABLE IF EXISTS sem.entity_document CASCADE;
CREATE TABLE sem.entity_document AS
SELECT 
    d.document_key,
    d.document_node,
    d.title,
    d.owner,
    d.folder_flag,
    d.file_name,
    d.file_extension,
    d.revision,
    d.change_number,
    d.status,
    d.document_summary,
    d.modified_date,
    d.rowguid
FROM dw.dim_document d; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_document
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_document
  model: null
  entities: []
  dimensions:
  - name: document_node
    expr: document_node
    type: character varying
    description: Unique identifier for the document node
    searchable: false
  - name: title
    expr: title
    type: character varying
    description: The title of the document
    searchable: false
  - name: folder_flag
    expr: folder_flag
    type: boolean
    description: Indicates if the document is a folder
    searchable: false
  - name: file_name
    expr: file_name
    type: character varying
    description: Name of the file associated with the document
    searchable: false
  - name: file_extension
    expr: file_extension
    type: character varying
    description: File extension of the document
    searchable: false
  - name: revision
    expr: revision
    type: character
    description: Revision identifier of the document
    searchable: false
  - name: document_summary
    expr: document_summary
    type: text
    description: Summary or description of the document
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Date when the document was last modified
    searchable: false
  - name: rowguid
    expr: rowguid
    type: uuid
    description: Unique global identifier for the record
    searchable: false
  measures:
  - name: document_key
    expr: document_key
    agg: sum
    description: Aggregated key representing the document identifier
    type: integer
  - name: owner
    expr: owner
    agg: sum
    description: Aggregated numeric identifier for the document owner
    type: integer
  - name: change_number
    expr: change_number
    agg: sum
    description: Total change number count for revisions
    type: integer
  - name: status
    expr: status
    agg: sum
    description: Aggregated status code for the document
    type: smallint
', 'postgres');
INSERT INTO public.datasets VALUES ('3702c05b-e03b-40fe-b7a1-1e9cdf592b25', 'entity_contact', 'entity_contact', 'Generated model for entity_contact', NULL, 'view', '/* entity_contact */
DROP TABLE IF EXISTS sem.entity_contact CASCADE;
CREATE TABLE sem.entity_contact AS
SELECT 
    bec.business_entity_contact_key,
    bec.business_entity_id,
    bec.person_id AS fk_person,
    bec.contact_type_id,
    bec.modified_date
FROM dw.bridge_business_entity_contact bec; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_contact
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_contact
  model: null
  entities:
  - name: entity_person
    ref_: null
    expr: fk_person
    type: foreign
    description: Reference to the person record
    project_path: null
  - name: entity_business_entity
    ref_: null
    expr: business_entity_id
    type: foreign
    description: Reference to the business entity
    project_path: null
  - name: entity_contact_type
    ref_: null
    expr: contact_type_id
    type: foreign
    description: Reference to the contact type
    project_path: null
  dimensions:
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Indicates the timestamp when the record was last updated
    searchable: false
  measures:
  - name: business_entity_contact_key
    expr: business_entity_contact_key
    agg: sum
    description: Unique identifier for the business entity contact
    type: integer
  - name: business_entity_id
    expr: business_entity_id
    agg: sum
    description: Identifier linking to the corresponding business entity
    type: integer
  - name: fk_person
    expr: fk_person
    agg: sum
    description: Foreign key linking to the person entity
    type: integer
  - name: contact_type_id
    expr: contact_type_id
    agg: sum
    description: Identifier for the type of contact
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('4d2fd88a-3779-42d8-a9fb-d2b2373705ba', 'entity_transaction_history', 'entity_transaction_history', 'Generated model for entity_transaction_history', NULL, 'view', '/* entity_transaction_history */
DROP TABLE IF EXISTS sem.entity_transaction_history CASCADE;
CREATE TABLE sem.entity_transaction_history AS
SELECT 
    th.transaction_history_key,
    th.transaction_id,
    th.product_id,
    th.reference_order_id,
    th.reference_order_line_id,
    th.transaction_date,
    th.transaction_type,
    th.quantity,
    th.actual_cost,
    th.modified_date
FROM dw.fact_transaction_history th; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_transaction_history
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_transaction_history
  model: null
  entities:
  - name: entity_product
    ref_: null
    expr: product_id
    type: foreign
    description: Reference to the product
    project_path: null
  - name: entity_sales_order
    ref_: null
    expr: reference_order_id
    type: foreign
    description: Reference to the sales order
    project_path: null
  dimensions:
  - name: transaction_date
    expr: transaction_date
    type: timestamp without time zone
    description: The date and time when the transaction occurred.
    searchable: false
  - name: transaction_type
    expr: transaction_type
    type: character
    description: The type or category of the transaction.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date and time when the record was last modified.
    searchable: false
  measures:
  - name: transaction_history_key
    expr: transaction_history_key
    agg: sum
    description: Unique key for the transaction history record.
    type: integer
  - name: transaction_id
    expr: transaction_id
    agg: sum
    description: Identifier for the transaction.
    type: integer
  - name: product_id
    expr: product_id
    agg: sum
    description: Identifier for the product involved in the transaction.
    type: integer
  - name: reference_order_id
    expr: reference_order_id
    agg: sum
    description: Identifier for the reference order related to the transaction.
    type: integer
  - name: reference_order_line_id
    expr: reference_order_line_id
    agg: sum
    description: Identifier for the specific line in the reference order.
    type: integer
  - name: quantity
    expr: quantity
    agg: sum
    description: Quantity of the product transacted.
    type: integer
  - name: actual_cost
    expr: actual_cost
    agg: sum
    description: The actual cost recorded for the transaction.
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('ade73c2d-3866-40e5-bf92-0be3884e8ee2', 'entity_product_description', 'entity_product_description', 'Generated model for entity_product_description', NULL, 'view', '/* entity_product_description */
DROP TABLE IF EXISTS sem.entity_product_description CASCADE;
CREATE TABLE sem.entity_product_description AS
SELECT 
    pd.product_description_key,
    pd.product_description_id,
    pd.description,
    pd.rowguid,
    pd.modified_date
FROM dw.dim_product_description pd; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_product_description
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_product_description
  model: null
  entities: []
  dimensions:
  - name: description
    expr: description
    type: character varying
    description: Textual details providing information about the product.
    searchable: false
  - name: rowguid
    expr: rowguid
    type: uuid
    description: Unique identifier ensuring distinct row entries.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The timestamp marking the last update to the record.
    searchable: false
  measures:
  - name: product_description_key
    expr: product_description_key
    agg: sum
    description: Summed numeric key uniquely identifying the record.
    type: integer
  - name: product_description_id
    expr: product_description_id
    agg: sum
    description: Summed identifier representing the product description record.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('d484cfbd-bb0f-4d68-b501-e4b33d606085', 'entity_sales_territory_history', 'entity_sales_territory_history', 'Generated model for entity_sales_territory_history', NULL, 'view', '/* entity_sales_territory_history */
DROP TABLE IF EXISTS sem.entity_sales_territory_history CASCADE;
CREATE TABLE sem.entity_sales_territory_history AS
SELECT 
    sth.sales_territory_history_key,
    sth.business_entity_id,
    sth.territory_id,
    sth.start_date,
    sth.end_date,
    sth.rowguid,
    sth.modified_date
FROM dw.fact_sales_territory_history sth; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_sales_territory_history
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_sales_territory_history
  model: null
  entities:
  - name: entity_sales_person
    ref_: null
    expr: business_entity_id
    type: foreign
    description: Reference to the sales person
    project_path: null
  - name: entity_sales_territory
    ref_: null
    expr: territory_id
    type: foreign
    description: Reference to the sales territory
    project_path: null
  dimensions:
  - name: start_date
    expr: start_date
    type: timestamp without time zone
    description: The date when the sales territory history record becomes effective.
    searchable: false
  - name: end_date
    expr: end_date
    type: timestamp without time zone
    description: The date when the sales territory history record expires.
    searchable: false
  - name: rowguid
    expr: rowguid
    type: uuid
    description: Unique identifier for the record, typically used for replication purposes.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp indicating when the record was last modified.
    searchable: false
  measures:
  - name: sales_territory_history_key
    expr: sales_territory_history_key
    agg: sum
    description: Primary key for aggregating sales territory history records.
    type: integer
  - name: business_entity_id
    expr: business_entity_id
    agg: sum
    description: Identifier for the business entity associated with this sales territory history.
    type: integer
  - name: territory_id
    expr: territory_id
    agg: sum
    description: Identifier for the sales territory associated with this record.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('986d5fd4-a7bb-4d9f-8736-5c400cee591f', 'entity_credit_card', 'entity_credit_card', 'Generated model for entity_credit_card', NULL, 'view', '/* entity_credit_card */
DROP TABLE IF EXISTS sem.entity_credit_card CASCADE;
CREATE TABLE sem.entity_credit_card AS
SELECT 
    cc.credit_card_key,
    cc.credit_card_id,
    cc.card_type,
    cc.card_number,
    cc.exp_month,
    cc.exp_year,
    cc.modified_date
FROM dw.dim_credit_card cc; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_credit_card
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_credit_card
  model: null
  entities: []
  dimensions:
  - name: card_type
    expr: card_type
    type: character varying
    description: Type of credit card, e.g., Visa, MasterCard
    searchable: false
  - name: card_number
    expr: card_number
    type: character varying
    description: Credit card number used for transactions
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date when the credit card record was last updated
    searchable: false
  measures:
  - name: credit_card_key
    expr: credit_card_key
    agg: sum
    description: Unique key identifier for the credit card
    type: integer
  - name: credit_card_id
    expr: credit_card_id
    agg: sum
    description: Credit card identifier corresponding to external records
    type: integer
  - name: exp_month
    expr: exp_month
    agg: sum
    description: Expiration month of the credit card
    type: smallint
  - name: exp_year
    expr: exp_year
    agg: sum
    description: Expiration year of the credit card
    type: smallint
', 'postgres');
INSERT INTO public.datasets VALUES ('4d452aad-a4ca-4f9e-a91c-b954025eaa34', 'entity_inventory', 'entity_inventory', 'Generated model for entity_inventory', NULL, 'view', '/* entity_inventory */
DROP TABLE IF EXISTS sem.entity_inventory CASCADE;
CREATE TABLE sem.entity_inventory AS
SELECT 
    i.product_inventory_key,
    i.product_id AS fk_product,
    prod.name AS product_name,
    i.location_id AS fk_location,
    loc.name AS location_name,
    i.quantity,
    i.modified_date
FROM dw.fact_product_inventory i
LEFT JOIN dw.dim_product prod
    ON i.product_id = prod.product_id
LEFT JOIN dw.dim_location loc
    ON i.location_id = loc.location_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_inventory
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_inventory
  model: null
  entities:
  - name: entity_product
    ref_: null
    expr: fk_product
    type: foreign
    description: Reference to the product
    project_path: null
  dimensions:
  - name: product_name
    expr: product_name
    type: character varying
    description: The name of the product.
    searchable: false
  - name: location_name
    expr: location_name
    type: character varying
    description: The location where the product is stored or sold.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The timestamp when the inventory record was last updated.
    searchable: false
  measures:
  - name: product_inventory_key
    expr: product_inventory_key
    agg: sum
    description: Unique key identifier for product inventory records.
    type: integer
  - name: fk_product
    expr: fk_product
    agg: sum
    description: Foreign key linking to product entity.
    type: integer
  - name: fk_location
    expr: fk_location
    agg: sum
    description: Foreign key linking to location entity.
    type: integer
  - name: quantity
    expr: quantity
    agg: sum
    description: The quantity of product available in inventory.
    type: smallint
', 'postgres');
INSERT INTO public.datasets VALUES ('d49bcdad-4a59-48f3-b1e5-13970a621829', 'entity_person_credit_card', 'entity_person_credit_card', 'Generated model for entity_person_credit_card', NULL, 'view', '/* entity_person_credit_card */
DROP TABLE IF EXISTS sem.entity_person_credit_card CASCADE;
CREATE TABLE sem.entity_person_credit_card AS
SELECT 
    pcc.person_credit_card_key,
    pcc.business_entity_id AS fk_person,
    pcc.credit_card_id AS fk_credit_card,
    pcc.modified_date
FROM dw.bridge_person_credit_card pcc; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_person_credit_card
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_person_credit_card
  model: null
  entities:
  - name: entity_person
    ref_: null
    expr: fk_person
    type: foreign
    description: Reference to the person record
    project_path: null
  - name: entity_credit_card
    ref_: null
    expr: fk_credit_card
    type: foreign
    description: Reference to the credit card record
    project_path: null
  dimensions:
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp representing the last update to the record
    searchable: false
  measures:
  - name: person_credit_card_key
    expr: person_credit_card_key
    agg: sum
    description: Unique identifier for the person credit card record
    type: integer
  - name: fk_person
    expr: fk_person
    agg: sum
    description: Foreign key linking to the person entity
    type: integer
  - name: fk_credit_card
    expr: fk_credit_card
    agg: sum
    description: Foreign key linking to the credit card entity
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('9711ca55-8329-4fd9-8b20-b6a3289f3d38', 'entity_sales_person', 'entity_sales_person', 'Generated model for entity_sales_person', NULL, 'view', '/* entity_sales_person */
DROP TABLE IF EXISTS sem.entity_sales_person CASCADE;
CREATE TABLE sem.entity_sales_person AS
SELECT 
    sp.sales_person_key,
    sp.business_entity_id AS fk_person,
    p.first_name,
    p.last_name,
    sp.territory_id AS fk_territory,
    st.name AS territory_name,
    sp.sales_quota,
    sp.bonus,
    sp.commission_pct,
    sp.sales_ytd,
    sp.sales_last_year,
    sp.modified_date,
    CASE WHEN sp.sales_ytd >= sp.sales_quota THEN ''Met Quota''
         ELSE ''Below Quota'' END AS segment_quota_status,
    (
     SELECT COALESCE(SUM(x.line_total),0) FROM dw.fact_sales x 
     WHERE x.sales_person_id = sp.business_entity_id 
       AND x.order_date >= CURRENT_DATE - INTERVAL ''12 months''
    ) AS total_sales_last_12_months,
    (
     SELECT COUNT(*) FROM dw.fact_sales x 
     WHERE x.sales_person_id = sp.business_entity_id 
       AND x.order_date >= CURRENT_DATE - INTERVAL ''12 months''
    ) AS total_orders_last_12_months,
    (
     SELECT CASE WHEN COUNT(*) = 0 THEN NULL 
                 ELSE COALESCE(SUM(x.line_total),0) / COUNT(*) END 
     FROM dw.fact_sales x 
     WHERE x.sales_person_id = sp.business_entity_id 
       AND x.order_date >= CURRENT_DATE - INTERVAL ''12 months''
    ) AS average_order_value_last_12_months
FROM dw.dim_sales_person sp
LEFT JOIN dw.dim_person p
    ON sp.business_entity_id = p.business_entity_id
LEFT JOIN dw.dim_sales_territory st
    ON sp.territory_id = st.territory_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_sales_person
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_sales_person
  model: null
  entities:
  - name: entity_person
    ref_: null
    expr: fk_person
    type: foreign
    description: Reference to the person record
    project_path: null
  - name: entity_sales_territory
    ref_: null
    expr: fk_territory
    type: foreign
    description: Reference to the sales territory
    project_path: null
  dimensions:
  - name: first_name
    expr: first_name
    type: character varying
    description: The first name of the sales person
    searchable: false
  - name: last_name
    expr: last_name
    type: character varying
    description: The last name of the sales person
    searchable: false
  - name: territory_name
    expr: territory_name
    type: character varying
    description: The name of the territory assigned to the sales person
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date and time when the record was last modified
    searchable: false
  - name: segment_quota_status
    expr: segment_quota_status
    type: text
    description: The current quota status segment of the sales person
    searchable: false
  measures:
  - name: sales_person_key
    expr: sales_person_key
    agg: sum
    description: A unique key identifying the sales person
    type: integer
  - name: fk_person
    expr: fk_person
    agg: sum
    description: Foreign key linking to the person entity
    type: integer
  - name: fk_territory
    expr: fk_territory
    agg: sum
    description: Foreign key linking to the territory entity
    type: integer
  - name: sales_quota
    expr: sales_quota
    agg: sum
    description: The total sales quota assigned to the sales person
    type: numeric
  - name: bonus
    expr: bonus
    agg: sum
    description: Bonus earned by the sales person
    type: numeric
  - name: commission_pct
    expr: commission_pct
    agg: sum
    description: The commission percentage applicable to the sales person
    type: numeric
  - name: sales_ytd
    expr: sales_ytd
    agg: sum
    description: Year-to-date sales figure for the sales person
    type: numeric
  - name: sales_last_year
    expr: sales_last_year
    agg: sum
    description: Total sales made by the sales person in the previous year
    type: numeric
  - name: total_sales_last_12_months
    expr: total_sales_last_12_months
    agg: sum
    description: Aggregate sales over the last twelve months
    type: numeric
  - name: total_orders_last_12_months
    expr: total_orders_last_12_months
    agg: sum
    description: Total number of orders processed in the last twelve months
    type: bigint
  - name: average_order_value_last_12_months
    expr: average_order_value_last_12_months
    agg: sum
    description: Average value of orders over the last twelve months
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('3e614f8c-7c61-4acb-ba7b-c006faea1aa5', 'entity_work_order_routing', 'entity_work_order_routing', 'Generated model for entity_work_order_routing', NULL, 'view', '/* entity_work_order_routing */
DROP TABLE IF EXISTS sem.entity_work_order_routing CASCADE;
CREATE TABLE sem.entity_work_order_routing AS
SELECT 
    wor.work_order_routing_key,
    wor.work_order_id,
    wor.product_id,
    wor.operation_sequence,
    wor.location_id,
    wor.scheduled_start_date,
    wor.scheduled_end_date,
    wor.actual_start_date,
    wor.actual_end_date,
    wor.actual_resource_hrs,
    wor.planned_cost,
    wor.actual_cost,
    wor.modified_date
FROM dw.fact_work_order_routing wor; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_work_order_routing
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_work_order_routing
  model: null
  entities:
  - name: entity_work_order
    ref_: null
    expr: work_order_id
    type: foreign
    description: Reference to the work order
    project_path: null
  - name: entity_product
    ref_: null
    expr: product_id
    type: foreign
    description: Reference to the product
    project_path: null
  dimensions:
  - name: scheduled_start_date
    expr: scheduled_start_date
    type: timestamp without time zone
    description: The timestamp indicating when the work order is scheduled to begin.
    searchable: false
  - name: scheduled_end_date
    expr: scheduled_end_date
    type: timestamp without time zone
    description: The timestamp indicating when the work order is scheduled to be completed.
    searchable: false
  - name: actual_start_date
    expr: actual_start_date
    type: timestamp without time zone
    description: The recorded timestamp when the work order actually began.
    searchable: false
  - name: actual_end_date
    expr: actual_end_date
    type: timestamp without time zone
    description: The recorded timestamp when the work order actually ended.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The timestamp of the last modification made to the work order routing record.
    searchable: false
  measures:
  - name: work_order_routing_key
    expr: work_order_routing_key
    agg: sum
    description: A unique identifier for the work order routing record, used for aggregation.
    type: integer
  - name: work_order_id
    expr: work_order_id
    agg: sum
    description: The identifier linking the record to a specific work order for aggregation purposes.
    type: integer
  - name: product_id
    expr: product_id
    agg: sum
    description: The identifier of the product associated with the work order routing, used for aggregation.
    type: integer
  - name: operation_sequence
    expr: operation_sequence
    agg: sum
    description: The sequence order of operations in the routing process, summed for analysis.
    type: smallint
  - name: location_id
    expr: location_id
    agg: sum
    description: The identifier for the location where the work order routing is executed, used in aggregations.
    type: integer
  - name: actual_resource_hrs
    expr: actual_resource_hrs
    agg: sum
    description: The total hours of resources actually utilized in the work order routing.
    type: numeric
  - name: planned_cost
    expr: planned_cost
    agg: sum
    description: The estimated cost associated with the work order routing, summed across records.
    type: numeric
  - name: actual_cost
    expr: actual_cost
    agg: sum
    description: The actual cost incurred during the execution of the work order routing.
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('2ca39c75-70bc-48d8-aa5e-3e77a5dcb7a8', 'entity_address', 'entity_address', 'Generated model for entity_address', NULL, 'view', '/* entity_address */
DROP TABLE IF EXISTS sem.entity_address CASCADE;
CREATE TABLE sem.entity_address AS
SELECT 
    a.address_key,
    a.address_id,
    a.address_line1,
    a.address_line2,
    a.city,
    a.state_province_id,
    a.postal_code,
    at.name AS address_type,
    a.modified_date
FROM dw.dim_address a
LEFT JOIN dw.bridge_business_entity_address bea
    ON a.address_id = bea.address_id
LEFT JOIN dw.dim_address_type at
    ON bea.address_type_id = at.address_type_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_address
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_address
  model: null
  entities: []
  dimensions:
  - name: address_line1
    expr: address_line1
    type: character varying
    description: The primary address line
    searchable: false
  - name: address_line2
    expr: address_line2
    type: character varying
    description: The secondary address line, if applicable
    searchable: false
  - name: city
    expr: city
    type: character varying
    description: The city of the address
    searchable: false
  - name: postal_code
    expr: postal_code
    type: character varying
    description: The postal or ZIP code
    searchable: false
  - name: address_type
    expr: address_type
    type: character varying
    description: The type of address (e.g., residential, commercial)
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date and time when the address was last updated
    searchable: false
  measures:
  - name: address_key
    expr: address_key
    agg: sum
    description: Aggregate key for address records
    type: integer
  - name: address_id
    expr: address_id
    agg: sum
    description: Unique identifier for the address
    type: integer
  - name: state_province_id
    expr: state_province_id
    agg: sum
    description: Identifier for the state or province
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('239bd917-3736-433e-95e9-17bcc38af6de', 'entity_currency', 'entity_currency', 'Generated model for entity_currency', NULL, 'view', '/* entity_currency */
DROP TABLE IF EXISTS sem.entity_currency CASCADE;
CREATE TABLE sem.entity_currency AS
SELECT 
    c.currency_key,
    c.currency_code,
    c.name,
    c.modified_date
FROM dw.dim_currency c; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_currency
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_currency
  model: null
  entities: []
  dimensions:
  - name: currency_code
    expr: currency_code
    type: character
    description: Unique code representing the currency
    searchable: false
  - name: name
    expr: name
    type: character varying
    description: Official name of the currency
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp indicating when the record was last updated
    searchable: false
  measures:
  - name: currency_key
    expr: currency_key
    agg: sum
    description: Aggregate key used for summing currency values
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('547f20e6-f3ef-4ed8-9d66-f70f629e3b23', 'entity_purchase_order', 'entity_purchase_order', 'Generated model for entity_purchase_order', NULL, 'view', '/* entity_purchase_order */
DROP TABLE IF EXISTS sem.entity_purchase_order CASCADE;
CREATE TABLE sem.entity_purchase_order AS
SELECT 
    p.purchase_key,
    p.purchase_order_id,
    p.order_date,
    p.due_date,
    p.vendor_key AS fk_vendor,
    v.name AS vendor_name,
    p.product_key AS fk_product,
    prod.name AS product_name,
    p.order_qty,
    p.unit_price,
    (p.order_qty * p.unit_price) AS total_cost,
    p.modified_date,
    CASE WHEN p.order_date >= CURRENT_DATE - INTERVAL ''12 months''
         THEN ''Recent'' ELSE ''Older'' END AS segment_recent_purchase
FROM dw.fact_purchases p
LEFT JOIN dw.dim_vendor v
    ON p.vendor_key = v.business_entity_id
LEFT JOIN dw.dim_product prod
    ON p.product_key = prod.product_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_purchase_order
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_purchase_order
  model: null
  entities:
  - name: entity_vendor
    ref_: null
    expr: fk_vendor
    type: foreign
    description: Reference to the vendor
    project_path: null
  - name: entity_product
    ref_: null
    expr: fk_product
    type: foreign
    description: Reference to the product
    project_path: null
  dimensions:
  - name: order_date
    expr: order_date
    type: timestamp without time zone
    description: Date when the order was placed
    searchable: false
  - name: due_date
    expr: due_date
    type: timestamp without time zone
    description: Due date for order delivery
    searchable: false
  - name: vendor_name
    expr: vendor_name
    type: character varying
    description: Name of the vendor supplying the order
    searchable: false
  - name: product_name
    expr: product_name
    type: character varying
    description: Name or description of the product ordered
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Date when the order record was last modified
    searchable: false
  - name: segment_recent_purchase
    expr: segment_recent_purchase
    type: text
    description: Segment categorization for recent purchases
    searchable: false
  measures:
  - name: purchase_key
    expr: purchase_key
    agg: sum
    description: Unique key identifying the purchase
    type: integer
  - name: purchase_order_id
    expr: purchase_order_id
    agg: sum
    description: Identifier associated with the purchase order
    type: integer
  - name: fk_vendor
    expr: fk_vendor
    agg: sum
    description: Foreign key linking to the vendor entity
    type: integer
  - name: fk_product
    expr: fk_product
    agg: sum
    description: Foreign key linking to the product entity
    type: integer
  - name: order_qty
    expr: order_qty
    agg: sum
    description: Quantity of products ordered
    type: smallint
  - name: unit_price
    expr: unit_price
    agg: sum
    description: Price per unit of the product at the time of purchase
    type: numeric
  - name: total_cost
    expr: total_cost
    agg: sum
    description: Total cost computed for the order
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('a452d58f-af91-40ca-82c6-c3eb94139684', 'entity_scrap_reason', 'entity_scrap_reason', 'Generated model for entity_scrap_reason', NULL, 'view', '/* entity_scrap_reason */
DROP TABLE IF EXISTS sem.entity_scrap_reason CASCADE;
CREATE TABLE sem.entity_scrap_reason AS
SELECT 
    sr.scrap_reason_key,
    sr.scrap_reason_id,
    sr.name,
    sr.modified_date
FROM dw.dim_scrap_reason sr; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_scrap_reason
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_scrap_reason
  model: null
  entities: []
  dimensions:
  - name: name
    expr: name
    type: character varying
    description: The descriptive name for the scrap reason.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The timestamp indicating when the scrap reason was last modified.
    searchable: false
  measures:
  - name: scrap_reason_key
    expr: scrap_reason_key
    agg: sum
    description: The key identifier used for aggregating scrap reasons.
    type: integer
  - name: scrap_reason_id
    expr: scrap_reason_id
    agg: sum
    description: The unique identifier for each scrap reason entry.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('3b177be3-b9b7-4d50-8429-2619727f503d', 'entity_work_order', 'entity_work_order', 'Generated model for entity_work_order', NULL, 'view', '/* entity_work_order */
DROP TABLE IF EXISTS sem.entity_work_order CASCADE;
CREATE TABLE sem.entity_work_order AS
SELECT 
    w.work_order_key,
    w.work_order_id,
    w.product_id AS fk_product,
    prod.name AS product_name,
    w.order_qty,
    w.scrapped_qty,
    w.start_date,
    w.end_date,
    w.due_date,
    w.modified_date,
    CASE WHEN w.order_qty > 0 THEN (w.order_qty - w.scrapped_qty) / w.order_qty::decimal 
         ELSE NULL END AS order_completion_ratio,
    CASE WHEN w.scrapped_qty > 0 THEN ''Scrapped''
         ELSE ''Clean'' END AS segment_scrap_status
FROM dw.fact_work_order w
LEFT JOIN dw.dim_product prod
    ON w.product_id = prod.product_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_work_order
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_work_order
  model: null
  entities:
  - name: entity_product
    ref_: null
    expr: fk_product
    type: foreign
    description: Reference to the product
    project_path: null
  dimensions:
  - name: product_name
    expr: product_name
    type: character varying
    description: The name of the product associated with the work order.
    searchable: false
  - name: start_date
    expr: start_date
    type: timestamp without time zone
    description: The starting date when the work order becomes active.
    searchable: false
  - name: end_date
    expr: end_date
    type: timestamp without time zone
    description: The ending date when the work order is scheduled to finish.
    searchable: false
  - name: due_date
    expr: due_date
    type: timestamp without time zone
    description: The due date by which the work order must be completed.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date when modifications were last made to the work order.
    searchable: false
  - name: segment_scrap_status
    expr: segment_scrap_status
    type: text
    description: Indicator of whether any segment of the work order has been scrapped.
    searchable: false
  measures:
  - name: work_order_key
    expr: work_order_key
    agg: sum
    description: A unique key used for aggregating work order data.
    type: integer
  - name: work_order_id
    expr: work_order_id
    agg: sum
    description: An identifier for the work order used in aggregation tasks.
    type: integer
  - name: fk_product
    expr: fk_product
    agg: sum
    description: Foreign key linking the work order to a specific product.
    type: integer
  - name: order_qty
    expr: order_qty
    agg: sum
    description: The total quantity ordered in this work order.
    type: integer
  - name: scrapped_qty
    expr: scrapped_qty
    agg: sum
    description: The total quantity that has been scrapped or rejected.
    type: smallint
  - name: order_completion_ratio
    expr: order_completion_ratio
    agg: sum
    description: A ratio that indicates the degree of order completion relative to the total quantity.
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('f74d1538-8402-4e4c-a380-49287263de9d', 'entity_sales_territory', 'entity_sales_territory', 'Generated model for entity_sales_territory', NULL, 'view', '/* entity_sales_territory */
DROP TABLE IF EXISTS sem.entity_sales_territory CASCADE;
CREATE TABLE sem.entity_sales_territory AS
SELECT
    t.territory_key,
    t.territory_id,
    t.name,
    t.country_region_code,
    t.group_name,
    t.sales_ytd,
    t.sales_last_year,
    t.cost_ytd,
    t.cost_last_year,
    t.rowguid,
    t.modified_date
FROM dw.dim_sales_territory t; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_sales_territory
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_sales_territory
  model: null
  entities: []
  dimensions:
  - name: name
    expr: name
    type: character varying
    description: The name of the sales territory
    searchable: false
  - name: country_region_code
    expr: country_region_code
    type: character varying
    description: The country or region code associated with the territory
    searchable: false
  - name: group_name
    expr: group_name
    type: character varying
    description: The group or department name within the sales structure
    searchable: false
  - name: rowguid
    expr: rowguid
    type: uuid
    description: A unique identifier (GUID) for the record
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date and time when the record was last modified
    searchable: false
  measures:
  - name: territory_key
    expr: territory_key
    agg: sum
    description: A numerical key representing the territory
    type: integer
  - name: territory_id
    expr: territory_id
    agg: sum
    description: The unique identifier for the territory used in aggregations
    type: integer
  - name: sales_ytd
    expr: sales_ytd
    agg: sum
    description: Year-to-date total sales for the territory
    type: numeric
  - name: sales_last_year
    expr: sales_last_year
    agg: sum
    description: Total sales from the previous year for the territory
    type: numeric
  - name: cost_ytd
    expr: cost_ytd
    agg: sum
    description: Year-to-date total cost associated with the territory
    type: numeric
  - name: cost_last_year
    expr: cost_last_year
    agg: sum
    description: Total cost incurred in the previous year for the territory
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('494b86b1-f12f-41a6-b03b-2ae17653684b', 'entity_ship_method', 'entity_ship_method', 'Generated model for entity_ship_method', NULL, 'view', '/* entity_ship_method */
DROP TABLE IF EXISTS sem.entity_ship_method CASCADE;
CREATE TABLE sem.entity_ship_method AS
SELECT 
    sm.ship_method_key,
    sm.ship_method_id,
    sm.name,
    sm.ship_base,
    sm.ship_rate,
    sm.rowguid,
    sm.modified_date
FROM dw.dim_ship_method sm; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_ship_method
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_ship_method
  model: null
  entities: []
  dimensions:
  - name: name
    expr: name
    type: character varying
    description: The name of the shipping method.
    searchable: false
  - name: rowguid
    expr: rowguid
    type: uuid
    description: The unique identifier (UUID) for the record.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date and time when the record was last updated.
    searchable: false
  measures:
  - name: ship_method_key
    expr: ship_method_key
    agg: sum
    description: Sum of unique keys for shipping methods.
    type: integer
  - name: ship_method_id
    expr: ship_method_id
    agg: sum
    description: Sum of shipping method IDs.
    type: integer
  - name: ship_base
    expr: ship_base
    agg: sum
    description: Sum of base shipping costs.
    type: numeric
  - name: ship_rate
    expr: ship_rate
    agg: sum
    description: Sum of shipping rates applied.
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('22799ae1-d5b5-4a75-969f-971e796465c8', 'entity_sales_tax_rate', 'entity_sales_tax_rate', 'Generated model for entity_sales_tax_rate', NULL, 'view', '/* entity_sales_tax_rate */
DROP TABLE IF EXISTS sem.entity_sales_tax_rate CASCADE;
CREATE TABLE sem.entity_sales_tax_rate AS
SELECT 
    str.sales_tax_rate_key,
    str.sales_tax_rate_id,
    str.state_province_id,
    str.tax_type,
    str.tax_rate,
    str.name,
    str.rowguid,
    str.modified_date
FROM dw.dim_sales_tax_rate str; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_sales_tax_rate
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_sales_tax_rate
  model: null
  entities: []
  dimensions:
  - name: name
    expr: name
    type: character varying
    description: The name of the sales tax rate, typically describing the tax category or designation.
    searchable: false
  - name: rowguid
    expr: rowguid
    type: uuid
    description: Unique row identifier (GUID) for the sales tax rate record.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp marking the last modification date of the sales tax rate record.
    searchable: false
  measures:
  - name: sales_tax_rate_key
    expr: sales_tax_rate_key
    agg: sum
    description: Unique key for the sales tax rate used in calculations and aggregations.
    type: integer
  - name: sales_tax_rate_id
    expr: sales_tax_rate_id
    agg: sum
    description: Identifier for the sales tax rate record.
    type: integer
  - name: state_province_id
    expr: state_province_id
    agg: sum
    description: Identifier linking the tax rate to its respective state or province.
    type: integer
  - name: tax_type
    expr: tax_type
    agg: sum
    description: Indicator representing the type of tax, such as state or local.
    type: smallint
  - name: tax_rate
    expr: tax_rate
    agg: sum
    description: Numeric value indicating the percentage rate of the sales tax.
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('e5aa8a57-3ef3-4470-b463-79ad0ecaad8e', 'entity_sales_order_sales_reason', 'entity_sales_order_sales_reason', 'Generated model for entity_sales_order_sales_reason', NULL, 'view', '/* entity_sales_order_sales_reason */
DROP TABLE IF EXISTS sem.entity_sales_order_sales_reason CASCADE;
CREATE TABLE sem.entity_sales_order_sales_reason AS
SELECT 
    shsr.sales_order_header_sales_reason_key,
    shsr.sales_order_id,
    shsr.sales_reason_id,
    shsr.modified_date
FROM dw.bridge_sales_order_header_sales_reason shsr; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_sales_order_sales_reason
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_sales_order_sales_reason
  model: null
  entities:
  - name: entity_sales_order
    ref_: null
    expr: sales_order_id
    type: foreign
    description: Reference to the sales order
    project_path: null
  - name: entity_sales_reason
    ref_: null
    expr: sales_reason_id
    type: foreign
    description: Reference to the sales reason
    project_path: null
  dimensions:
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Represents the timestamp of the last modification to the record.
    searchable: false
  measures:
  - name: sales_order_header_sales_reason_key
    expr: sales_order_header_sales_reason_key
    agg: sum
    description: Aggregated identifier for the sales order header sales reason.
    type: integer
  - name: sales_order_id
    expr: sales_order_id
    agg: sum
    description: Aggregated unique identifier for the sales order.
    type: integer
  - name: sales_reason_id
    expr: sales_reason_id
    agg: sum
    description: Aggregated unique identifier for the sales reason category.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('8c4ff2e6-7897-4d1b-8700-df76144c5f78', 'entity_employee', 'entity_employee', 'Generated model for entity_employee', NULL, 'view', '/* entity_employee */
DROP TABLE IF EXISTS sem.entity_employee CASCADE;
CREATE TABLE sem.entity_employee AS
SELECT 
    e.employee_key,
    e.business_entity_id AS fk_person,
    p.first_name,
    p.last_name,
    e.job_title,
    e.hire_date,
    e.birth_date,
    e.marital_status,
    e.gender,
    COALESCE(ep.avg_rate, 0) AS avg_pay_rate,
    e.modified_date,
    EXTRACT(YEAR FROM age(CURRENT_DATE, e.hire_date)) AS tenure_years,
    CASE WHEN e.current_flag THEN ''Active''
         ELSE ''Inactive'' END AS segment_employment_status
FROM dw.dim_employee e
JOIN dw.dim_person p
    ON e.business_entity_id = p.business_entity_id
LEFT JOIN (
    SELECT business_entity_id, AVG(rate) AS avg_rate
    FROM dw.fact_employee_pay_history
    GROUP BY business_entity_id
) ep
    ON e.business_entity_id = ep.business_entity_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_employee
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_employee
  model: null
  entities:
  - name: entity_person
    ref_: null
    expr: fk_person
    type: foreign
    description: Reference to the person record
    project_path: null
  dimensions:
  - name: first_name
    expr: first_name
    type: character varying
    description: Employee''s first name
    searchable: false
  - name: last_name
    expr: last_name
    type: character varying
    description: Employee''s last name
    searchable: false
  - name: job_title
    expr: job_title
    type: character varying
    description: Title of the employee''s job position
    searchable: false
  - name: hire_date
    expr: hire_date
    type: date
    description: Employee''s hire date
    searchable: false
  - name: birth_date
    expr: birth_date
    type: date
    description: Employee''s date of birth
    searchable: false
  - name: marital_status
    expr: marital_status
    type: character
    description: Employee''s marital status
    searchable: false
  - name: gender
    expr: gender
    type: character
    description: Employee''s gender
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Record''s last modified date
    searchable: false
  - name: segment_employment_status
    expr: segment_employment_status
    type: text
    description: Segment classification of employment status
    searchable: false
  measures:
  - name: employee_key
    expr: employee_key
    agg: sum
    description: Unique key identifier for the employee
    type: integer
  - name: fk_person
    expr: fk_person
    agg: sum
    description: Foreign key to the associated person record
    type: integer
  - name: avg_pay_rate
    expr: avg_pay_rate
    agg: sum
    description: Average pay rate for the employee
    type: numeric
  - name: tenure_years
    expr: tenure_years
    agg: sum
    description: Calculated employee tenure in years
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('d39747a7-1a07-4ea2-b057-49541771a647', 'entity_shift', 'entity_shift', 'Generated model for entity_shift', NULL, 'view', '/* entity_shift */
DROP TABLE IF EXISTS sem.entity_shift CASCADE;
CREATE TABLE sem.entity_shift AS
SELECT 
    s.shift_key,
    s.shift_id,
    s.name,
    s.start_time,
    s.end_time,
    s.modified_date
FROM dw.dim_shift s; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_shift
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_shift
  model: null
  entities: []
  dimensions:
  - name: name
    expr: name
    type: character varying
    description: The name identifying the entity or shift record
    searchable: false
  - name: start_time
    expr: start_time
    type: time without time zone
    description: The starting time of the shift
    searchable: false
  - name: end_time
    expr: end_time
    type: time without time zone
    description: The ending time of the shift
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The timestamp when the record was last modified
    searchable: false
  measures:
  - name: shift_key
    expr: shift_key
    agg: sum
    description: Aggregate sum of shift keys for numerical summarization
    type: integer
  - name: shift_id
    expr: shift_id
    agg: sum
    description: Aggregate sum of shift IDs for numerical summarization
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('fbd94258-7e8b-461c-9174-e3730b38428b', 'entity_customer', 'entity_customer', 'Generated model for entity_customer', NULL, 'view', '/* entity_customer */
DROP TABLE IF EXISTS sem.entity_customer CASCADE;
CREATE TABLE sem.entity_customer AS
SELECT 
    c.customer_key,
    c.customer_id,
    c.person_id AS fk_person,
    p.first_name,
    p.last_name,
    e.email_address,
    c.store_id AS fk_store,
    c.territory_id AS fk_territory,
    c.modified_date,
    CASE WHEN recent_order.order_count > 0 THEN ''Active''
         ELSE ''Inactive'' END AS segment_active_customer,
    (
     SELECT COUNT(*) FROM dw.fact_sales s 
     WHERE s.customer_key = c.customer_id 
       AND s.order_date >= CURRENT_DATE - INTERVAL ''12 months''
    ) AS total_orders_last_12_months,
    (
     SELECT COALESCE(SUM(s.line_total),0) FROM dw.fact_sales s 
     WHERE s.customer_key = c.customer_id 
       AND s.order_date >= CURRENT_DATE - INTERVAL ''12 months''
    ) AS total_revenue_last_12_months,
    (
     SELECT CASE WHEN COUNT(*) = 0 THEN NULL 
                 ELSE COALESCE(SUM(s.line_total),0) / COUNT(*) END 
     FROM dw.fact_sales s 
     WHERE s.customer_key = c.customer_id 
       AND s.order_date >= CURRENT_DATE - INTERVAL ''12 months''
    ) AS avg_order_value_last_12_months
FROM dw.dim_customer c
JOIN dw.dim_person p
    ON c.person_id = p.business_entity_id
LEFT JOIN dw.dim_email_address e
    ON p.business_entity_id = e.business_entity_id
LEFT JOIN (
    SELECT s.customer_key, COUNT(*) AS order_count
    FROM dw.fact_sales s
    WHERE s.order_date >= CURRENT_DATE - INTERVAL ''12 months''
    GROUP BY s.customer_key
) recent_order
    ON recent_order.customer_key = c.customer_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_customer
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_customer
  model: null
  entities: []
  dimensions:
  - name: first_name
    expr: first_name
    type: character varying
    description: The first name of the customer.
    searchable: false
  - name: last_name
    expr: last_name
    type: character varying
    description: The last name of the customer.
    searchable: false
  - name: email_address
    expr: email_address
    type: character varying
    description: The email address of the customer.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date when the customer record was last modified.
    searchable: false
  - name: segment_active_customer
    expr: segment_active_customer
    type: text
    description: Indicator if the customer is actively engaged.
    searchable: false
  measures:
  - name: customer_key
    expr: customer_key
    agg: sum
    description: Unique identifier key for the customer.
    type: integer
  - name: customer_id
    expr: customer_id
    agg: sum
    description: Identifier for the customer record.
    type: integer
  - name: fk_person
    expr: fk_person
    agg: sum
    description: Foreign key linking to the person record.
    type: integer
  - name: fk_store
    expr: fk_store
    agg: sum
    description: Foreign key linking to the store record.
    type: integer
  - name: fk_territory
    expr: fk_territory
    agg: sum
    description: Foreign key linking to the territory record.
    type: integer
  - name: total_orders_last_12_months
    expr: total_orders_last_12_months
    agg: sum
    description: Total number of orders in the last 12 months.
    type: bigint
  - name: total_revenue_last_12_months
    expr: total_revenue_last_12_months
    agg: sum
    description: Total revenue generated in the last 12 months.
    type: numeric
  - name: avg_order_value_last_12_months
    expr: avg_order_value_last_12_months
    agg: sum
    description: Average order value over the last 12 months.
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('bf277d59-9cca-4e26-bb1d-9bb2f6b91b93', 'entity_special_offer_product', 'entity_special_offer_product', 'Generated model for entity_special_offer_product', NULL, 'view', '/* entity_special_offer_product */
DROP TABLE IF EXISTS sem.entity_special_offer_product CASCADE;
CREATE TABLE sem.entity_special_offer_product AS
SELECT 
    sop.special_offer_product_key,
    sop.special_offer_id,
    sop.product_id,
    sop.rowguid,
    sop.modified_date
FROM dw.bridge_special_offer_product sop; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_special_offer_product
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_special_offer_product
  model: null
  entities:
  - name: entity_special_offer
    ref_: null
    expr: special_offer_id
    type: foreign
    description: Reference to the special offer
    project_path: null
  - name: entity_product
    ref_: null
    expr: product_id
    type: foreign
    description: Reference to the product
    project_path: null
  dimensions:
  - name: rowguid
    expr: rowguid
    type: uuid
    description: Unique identifier for the special offer product.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Date and time when the record was last modified.
    searchable: false
  measures:
  - name: special_offer_product_key
    expr: special_offer_product_key
    agg: sum
    description: Primary key for the special offer product record.
    type: integer
  - name: special_offer_id
    expr: special_offer_id
    agg: sum
    description: Identifier for the special offer associated with the product.
    type: integer
  - name: product_id
    expr: product_id
    agg: sum
    description: Identifier for the product in the special offer.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('2c2cd754-7969-4e2c-8912-44329e528c5d', 'entity_job_candidate', 'entity_job_candidate', 'Generated model for entity_job_candidate', NULL, 'view', '/* entity_job_candidate */
DROP TABLE IF EXISTS sem.entity_job_candidate CASCADE;
CREATE TABLE sem.entity_job_candidate AS
SELECT 
    jc.job_candidate_key,
    jc.job_candidate_id,
    jc.business_entity_id AS fk_person,
    p.first_name,
    p.last_name,
    jc.resume,
    jc.modified_date
FROM dw.dim_job_candidate jc
LEFT JOIN dw.dim_person p
    ON jc.business_entity_id = p.business_entity_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_job_candidate
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_job_candidate
  model: null
  entities:
  - name: entity_person
    ref_: null
    expr: fk_person
    type: foreign
    description: Reference to the person record
    project_path: null
  dimensions:
  - name: first_name
    expr: first_name
    type: character varying
    description: Candidate''s first name
    searchable: false
  - name: last_name
    expr: last_name
    type: character varying
    description: Candidate''s last name
    searchable: false
  - name: resume
    expr: resume
    type: xml
    description: Candidate''s resume in XML format
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp for when candidate record was modified
    searchable: false
  measures:
  - name: job_candidate_key
    expr: job_candidate_key
    agg: sum
    description: Unique key identifier for job candidate
    type: integer
  - name: job_candidate_id
    expr: job_candidate_id
    agg: sum
    description: ID assigned to job candidate
    type: integer
  - name: fk_person
    expr: fk_person
    agg: sum
    description: Foreign key referencing the person entity
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('67e5062a-788d-4608-a05f-4d70b84f24cf', 'entity_product_cost_history', 'entity_product_cost_history', 'Generated model for entity_product_cost_history', NULL, 'view', '/* entity_product_cost_history */
DROP TABLE IF EXISTS sem.entity_product_cost_history CASCADE;
CREATE TABLE sem.entity_product_cost_history AS
SELECT 
    pch.product_cost_history_key,
    pch.product_id,
    pch.start_date,
    pch.end_date,
    pch.standard_cost,
    pch.modified_date
FROM dw.fact_product_cost_history pch; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_product_cost_history
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_product_cost_history
  model: null
  entities:
  - name: entity_product
    ref_: null
    expr: product_id
    type: foreign
    description: Reference to the product
    project_path: null
  dimensions:
  - name: start_date
    expr: start_date
    type: timestamp without time zone
    description: Timestamp when the product cost history record becomes effective.
    searchable: false
  - name: end_date
    expr: end_date
    type: timestamp without time zone
    description: Timestamp when the product cost history record expires.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp when the record was last updated.
    searchable: false
  measures:
  - name: product_cost_history_key
    expr: product_cost_history_key
    agg: sum
    description: Unique key identifying the product cost history entry.
    type: integer
  - name: product_id
    expr: product_id
    agg: sum
    description: Identifier for the product associated with this cost history record.
    type: integer
  - name: standard_cost
    expr: standard_cost
    agg: sum
    description: Recorded standard cost for the product.
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('32cc8810-05e7-4703-aea3-5b7e8216eaf1', 'entity_special_offer', 'entity_special_offer', 'Generated model for entity_special_offer', NULL, 'view', '/* entity_special_offer */
DROP TABLE IF EXISTS sem.entity_special_offer CASCADE;
CREATE TABLE sem.entity_special_offer AS
SELECT 
    so.special_offer_key,
    so.special_offer_id,
    so.description,
    so.discount_pct,
    so.type,
    so.category,
    so.start_date,
    so.end_date,
    so.min_qty,
    so.max_qty,
    so.modified_date,
    CASE WHEN so.discount_pct > 0.2 THEN ''High Discount''
         ELSE ''Standard Discount'' END AS segment_discount_level
FROM dw.dim_special_offer so; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_special_offer
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_special_offer
  model: null
  entities: []
  dimensions:
  - name: description
    expr: description
    type: character varying
    description: Text describing the details of the special offer.
    searchable: false
  - name: type
    expr: type
    type: character varying
    description: Text indicating the type of offer.
    searchable: false
  - name: category
    expr: category
    type: character varying
    description: Text representing the category of the offer.
    searchable: false
  - name: start_date
    expr: start_date
    type: timestamp without time zone
    description: Timestamp when the offer starts.
    searchable: false
  - name: end_date
    expr: end_date
    type: timestamp without time zone
    description: Timestamp when the offer ends.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp of the last modification to the offer details.
    searchable: false
  - name: segment_discount_level
    expr: segment_discount_level
    type: text
    description: Text denoting the discount level based on segment criteria.
    searchable: false
  measures:
  - name: special_offer_key
    expr: special_offer_key
    agg: sum
    description: Unique key identifier for the special offer.
    type: integer
  - name: special_offer_id
    expr: special_offer_id
    agg: sum
    description: Identifier for the special offer.
    type: integer
  - name: discount_pct
    expr: discount_pct
    agg: sum
    description: Sum of discount percentages applied in the offer.
    type: numeric
  - name: min_qty
    expr: min_qty
    agg: sum
    description: Minimum quantity required for the offer.
    type: integer
  - name: max_qty
    expr: max_qty
    agg: sum
    description: Maximum quantity valid for the offer.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('55b4fb53-159c-4638-9136-745c2670143d', 'entity_culture', 'entity_culture', 'Generated model for entity_culture', NULL, 'view', '
/* entity_culture */
DROP TABLE IF EXISTS sem.entity_culture CASCADE;
CREATE TABLE sem.entity_culture AS
SELECT 
    culture_key,
    culture_id,
    name,
    modified_date
FROM dw.dim_culture; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_culture
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_culture
  model: null
  entities: []
  dimensions:
  - name: culture_id
    expr: culture_id
    type: character
    description: Unique identifier representing the culture.
    searchable: false
  - name: name
    expr: name
    type: character varying
    description: The name of the culture.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The timestamp marking when the record was last updated.
    searchable: false
  measures:
  - name: culture_key
    expr: culture_key
    agg: sum
    description: The aggregation of culture keys for summarizing culture data.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('b72ef391-fcb0-4b8f-91fb-675a4052d9b0', 'entity_contact_type', 'entity_contact_type', 'Generated model for entity_contact_type', NULL, 'view', '/* entity_contact_type */
/* entity_contact_type */
DROP TABLE IF EXISTS sem.entity_contact_type CASCADE;
CREATE TABLE sem.entity_contact_type AS
SELECT 
    contact_type_key,
    contact_type_id,
    name,
    modified_date
FROM dw.dim_contact_type; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_contact_type
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_contact_type
  model: null
  entities: []
  dimensions:
  - name: name
    expr: name
    type: character varying
    description: The name of the contact type
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date when the record was last modified
    searchable: false
  measures:
  - name: contact_type_key
    expr: contact_type_key
    agg: sum
    description: Aggregated key identifying the contact type
    type: integer
  - name: contact_type_id
    expr: contact_type_id
    agg: sum
    description: Aggregated identifier for the contact type
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('0b0f0ceb-1e0f-428b-bfd5-cc8aa8bd612b', 'entity_person', 'entity_person', 'Generated model for entity_person', NULL, 'view', '/* entity_person */
DROP TABLE IF EXISTS sem.entity_person CASCADE;
CREATE TABLE sem.entity_person AS
SELECT 
    p.person_key,
    p.business_entity_id AS fk_business_entity,
    p.first_name,
    p.last_name,
    p.title,
    e.email_address,
    pp.phone_number,
    CASE WHEN p.modified_date >= CURRENT_DATE - INTERVAL ''1 year''
         THEN ''Active'' ELSE ''Stale'' END AS segment_recent_update,
    p.modified_date
FROM dw.dim_person p
LEFT JOIN dw.dim_email_address e
    ON p.business_entity_id = e.business_entity_id
LEFT JOIN dw.dim_person_phone pp
    ON p.business_entity_id = pp.business_entity_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_person
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_person
  model: null
  entities:
  - name: entity_business_entity
    ref_: null
    expr: fk_business_entity
    type: foreign
    description: Reference to the business entity record
    project_path: null
  dimensions:
  - name: first_name
    expr: first_name
    type: character varying
    description: The given name of the person
    searchable: false
  - name: last_name
    expr: last_name
    type: character varying
    description: The family name or surname of the person
    searchable: false
  - name: title
    expr: title
    type: character varying
    description: The professional title or honorific of the person
    searchable: false
  - name: email_address
    expr: email_address
    type: character varying
    description: The email address of the person
    searchable: false
  - name: phone_number
    expr: phone_number
    type: character varying
    description: The contact phone number of the person
    searchable: false
  - name: segment_recent_update
    expr: segment_recent_update
    type: text
    description: A textual segment indicating recent changes
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The timestamp when the record was last updated
    searchable: false
  measures:
  - name: person_key
    expr: person_key
    agg: sum
    description: A unique key identifier for the person
    type: integer
  - name: fk_business_entity
    expr: fk_business_entity
    agg: sum
    description: A foreign key referencing the associated business entity
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('45cc0bcb-a906-4505-9337-1cfb59b9e71c', 'entity_department', 'entity_department', 'Generated model for entity_department', NULL, 'view', '/* entity_department */
DROP TABLE IF EXISTS sem.entity_department CASCADE;
CREATE TABLE sem.entity_department AS
SELECT 
    d.department_key,
    d.department_id,
    d.name AS department_name,
    d.group_name,
    d.modified_date,
    edh_count.employee_count
FROM dw.dim_department d
LEFT JOIN (
  SELECT department_id, COUNT(*) AS employee_count
  FROM dw.fact_employee_department_history
  GROUP BY department_id
) edh_count
    ON d.department_id = edh_count.department_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_department
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_department
  model: null
  entities: []
  dimensions:
  - name: department_name
    expr: department_name
    type: character varying
    description: The name of the department within the organization
    searchable: false
  - name: group_name
    expr: group_name
    type: character varying
    description: The name of the group associated with the department
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date and time when the department record was last updated
    searchable: false
  measures:
  - name: department_key
    expr: department_key
    agg: sum
    description: A unique key identifier for the department, used for aggregation
    type: integer
  - name: department_id
    expr: department_id
    agg: sum
    description: The identifier for the department used in system records
    type: integer
  - name: employee_count
    expr: employee_count
    agg: sum
    description: The total number of employees in the department
    type: bigint
', 'postgres');
INSERT INTO public.datasets VALUES ('12da0036-fee2-4724-9124-53f8540c0f57', 'entity_product_photo', 'entity_product_photo', 'Generated model for entity_product_photo', NULL, 'view', '/* entity_product_photo */
DROP TABLE IF EXISTS sem.entity_product_photo CASCADE;
CREATE TABLE sem.entity_product_photo AS
SELECT 
    pp.product_photo_key,
    pp.product_photo_id,
    pp.thumbnail_photo,
    pp.thumbnail_photo_file_name,
    pp.large_photo,
    pp.large_photo_file_name,
    pp.modified_date
FROM dw.dim_product_photo pp; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_product_photo
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_product_photo
  model: null
  entities: []
  dimensions:
  - name: thumbnail_photo
    expr: thumbnail_photo
    type: bytea
    description: Photo stored as bytea for thumbnail representation.
    searchable: false
  - name: thumbnail_photo_file_name
    expr: thumbnail_photo_file_name
    type: character varying
    description: Filename for the thumbnail photo.
    searchable: false
  - name: large_photo
    expr: large_photo
    type: bytea
    description: Photo stored as bytea for large representation.
    searchable: false
  - name: large_photo_file_name
    expr: large_photo_file_name
    type: character varying
    description: Filename for the large photo.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp indicating when the photo was last modified.
    searchable: false
  measures:
  - name: product_photo_key
    expr: product_photo_key
    agg: sum
    description: Unique numeric key representing the photo entry for aggregation.
    type: integer
  - name: product_photo_id
    expr: product_photo_id
    agg: sum
    description: Unique identifier for the photo used in aggregations.
    type: integer
', 'postgres');
INSERT INTO public.datasets VALUES ('2e28469d-47a4-425e-bdd7-07356e1214d8', 'entity_sales_person_quota_history', 'entity_sales_person_quota_history', 'Generated model for entity_sales_person_quota_history', NULL, 'view', '/* entity_sales_person_quota_history */
DROP TABLE IF EXISTS sem.entity_sales_person_quota_history CASCADE;
CREATE TABLE sem.entity_sales_person_quota_history AS
SELECT 
    sph.sales_person_quota_history_key,
    sph.business_entity_id,
    sph.quota_date,
    sph.sales_quota,
    sph.rowguid,
    sph.modified_date
FROM dw.fact_sales_person_quota_history sph; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_sales_person_quota_history
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_sales_person_quota_history
  model: null
  entities:
  - name: entity_sales_person
    ref_: null
    expr: business_entity_id
    type: foreign
    description: Reference to the sales person
    project_path: null
  dimensions:
  - name: quota_date
    expr: quota_date
    type: timestamp without time zone
    description: The date on which the sales quota was applied or recorded
    searchable: false
  - name: rowguid
    expr: rowguid
    type: uuid
    description: Unique identifier for the record
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp when the record was last modified
    searchable: false
  measures:
  - name: sales_person_quota_history_key
    expr: sales_person_quota_history_key
    agg: sum
    description: Primary key for the sales quota history record
    type: integer
  - name: business_entity_id
    expr: business_entity_id
    agg: sum
    description: Identifier for the business entity associated with the sales person
    type: integer
  - name: sales_quota
    expr: sales_quota
    agg: sum
    description: The allocated sales quota amount for the sales person
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('8b6a1dfd-da0a-4412-b707-eb444d94ae33', 'entity_vendor', 'entity_vendor', 'Generated model for entity_vendor', NULL, 'view', '/* entity_vendor */
DROP TABLE IF EXISTS sem.entity_vendor CASCADE;
CREATE TABLE sem.entity_vendor AS
SELECT 
    v.vendor_key,
    v.business_entity_id AS fk_person,
    v.name,
    v.credit_rating,
    v.preferred_vendor_status,
    v.active_flag,
    e.email_address,
    fv.average_lead_time,
    v.modified_date,
    CASE WHEN v.credit_rating >= 5 THEN ''High''
         ELSE ''Standard'' END AS segment_vendor_rating,
    (
     SELECT COUNT(*) FROM dw.fact_purchases x 
     WHERE x.vendor_key = v.business_entity_id 
       AND x.order_date >= CURRENT_DATE - INTERVAL ''12 months''
    ) AS total_purchase_orders_last_12_months,
    (
     SELECT COALESCE(SUM(x.order_qty * x.unit_price),0) FROM dw.fact_purchases x 
     WHERE x.vendor_key = v.business_entity_id 
       AND x.order_date >= CURRENT_DATE - INTERVAL ''12 months''
    ) AS total_purchase_cost_last_12_months
FROM dw.dim_vendor v
LEFT JOIN dw.dim_email_address e
    ON v.business_entity_id = e.business_entity_id
LEFT JOIN (
    SELECT business_entity_id, AVG(average_lead_time) AS average_lead_time
    FROM dw.fact_product_vendor
    GROUP BY business_entity_id
) fv
    ON v.business_entity_id = fv.business_entity_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_vendor
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_vendor
  model: null
  entities:
  - name: entity_person
    ref_: null
    expr: fk_person
    type: foreign
    description: Reference to the person record
    project_path: null
  dimensions:
  - name: name
    expr: name
    type: character varying
    description: Name of the vendor
    searchable: false
  - name: preferred_vendor_status
    expr: preferred_vendor_status
    type: boolean
    description: Indicates if the vendor is preferred
    searchable: false
  - name: active_flag
    expr: active_flag
    type: boolean
    description: Status flag representing if the vendor is currently active
    searchable: false
  - name: email_address
    expr: email_address
    type: character varying
    description: Contact email address for the vendor
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date and time when the vendor record was last modified
    searchable: false
  - name: segment_vendor_rating
    expr: segment_vendor_rating
    type: text
    description: Rating of vendor segment based on performance metrics
    searchable: false
  measures:
  - name: vendor_key
    expr: vendor_key
    agg: sum
    description: Unique key identifier for the vendor
    type: integer
  - name: fk_person
    expr: fk_person
    agg: sum
    description: Foreign key linking to the person entity associated with the vendor
    type: integer
  - name: credit_rating
    expr: credit_rating
    agg: sum
    description: Credit rating score assigned to the vendor
    type: smallint
  - name: average_lead_time
    expr: average_lead_time
    agg: sum
    description: Average lead time for vendor deliveries
    type: numeric
  - name: total_purchase_orders_last_12_months
    expr: total_purchase_orders_last_12_months
    agg: sum
    description: Total number of purchase orders placed in the last 12 months
    type: bigint
  - name: total_purchase_cost_last_12_months
    expr: total_purchase_cost_last_12_months
    agg: sum
    description: Aggregate cost of purchases made in the last 12 months
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('9fa460b4-1410-4e74-aa34-eb79027cd59c', 'entity_sales_order', 'entity_sales_order', 'Generated model for entity_sales_order', NULL, 'view', '/* entity_sales_order */
DROP TABLE IF EXISTS sem.entity_sales_order CASCADE;
CREATE TABLE sem.entity_sales_order AS
SELECT 
    s.sales_key,
    s.sales_order_id,
    s.order_date,
    s.due_date,
    s.ship_date,
    s.customer_key AS fk_customer,
    c.customer_id,
    s.product_key AS fk_product,
    prod.name AS product_name,
    s.order_qty,
    s.unit_price,
    s.unit_price_discount,
    s.line_total,
    s.sales_person_id AS fk_sales_person,
    sp.business_entity_id,
    s.territory_key AS fk_territory,
    st.name AS territory_name,
    s.bill_to_address AS fk_bill_to_address,
    s.ship_to_address AS fk_ship_to_address,
    s.modified_date,
    CASE WHEN s.order_date >= CURRENT_DATE - INTERVAL ''12 months''
         THEN ''Recent'' ELSE ''Older'' END AS segment_recent_order,
    EXTRACT(DAY FROM (s.ship_date - s.order_date)) AS days_to_ship,
    EXTRACT(DAY FROM (s.ship_date - s.due_date)) AS delivery_delay
FROM dw.fact_sales s
LEFT JOIN dw.dim_customer c
    ON s.customer_key = c.customer_id
LEFT JOIN dw.dim_product prod
    ON s.product_key = prod.product_id
LEFT JOIN dw.dim_sales_person sp
    ON s.sales_person_id = sp.business_entity_id
LEFT JOIN dw.dim_sales_territory st
    ON s.territory_key = st.territory_id; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_sales_order
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_sales_order
  model: null
  entities:
  - name: entity_customer
    ref_: null
    expr: fk_customer
    type: foreign
    description: Reference to the customer
    project_path: null
  - name: entity_product
    ref_: null
    expr: fk_product
    type: foreign
    description: Reference to the product
    project_path: null
  - name: entity_sales_person
    ref_: null
    expr: fk_sales_person
    type: foreign
    description: Reference to the sales person
    project_path: null
  - name: entity_sales_territory
    ref_: null
    expr: fk_territory
    type: foreign
    description: Reference to the sales territory
    project_path: null
  - name: entity_address
    ref_: null
    expr: fk_bill_to_address
    type: foreign
    description: Reference to the billing address
    project_path: null
  - name: entity_address
    ref_: null
    expr: fk_ship_to_address
    type: foreign
    description: Reference to the shipping address
    project_path: null
  dimensions:
  - name: order_date
    expr: order_date
    type: timestamp without time zone
    description: The date when the order was placed.
    searchable: false
  - name: due_date
    expr: due_date
    type: timestamp without time zone
    description: The expected date for order delivery.
    searchable: false
  - name: ship_date
    expr: ship_date
    type: timestamp without time zone
    description: The date when the order was shipped.
    searchable: false
  - name: product_name
    expr: product_name
    type: character varying
    description: The name of the product ordered.
    searchable: false
  - name: territory_name
    expr: territory_name
    type: character varying
    description: The name of the sales territory associated with the order.
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: The date when the order record was last modified.
    searchable: false
  - name: segment_recent_order
    expr: segment_recent_order
    type: text
    description: A segment identifier indicating recent order status.
    searchable: false
  measures:
  - name: sales_key
    expr: sales_key
    agg: sum
    description: The aggregated sum of sales key values, uniquely identifying sales transactions.
    type: integer
  - name: sales_order_id
    expr: sales_order_id
    agg: sum
    description: The aggregated sum of sales order IDs for reporting purposes.
    type: integer
  - name: fk_customer
    expr: fk_customer
    agg: sum
    description: The aggregated foreign key linking to customer records.
    type: integer
  - name: customer_id
    expr: customer_id
    agg: sum
    description: The aggregated sum of customer IDs associated with the orders.
    type: integer
  - name: fk_product
    expr: fk_product
    agg: sum
    description: The aggregated foreign key linking to product records.
    type: integer
  - name: order_qty
    expr: order_qty
    agg: sum
    description: The total quantity of items ordered aggregated across orders.
    type: smallint
  - name: unit_price
    expr: unit_price
    agg: sum
    description: The aggregated sum of unit prices for the ordered products.
    type: numeric
  - name: unit_price_discount
    expr: unit_price_discount
    agg: sum
    description: The aggregated sum of discounts applied to the unit prices.
    type: numeric
  - name: line_total
    expr: line_total
    agg: sum
    description: The total sum of line totals, representing order value after discounts.
    type: numeric
  - name: fk_sales_person
    expr: fk_sales_person
    agg: sum
    description: The aggregated foreign key identifying the sales person associated with the sale.
    type: integer
  - name: business_entity_id
    expr: business_entity_id
    agg: sum
    description: The aggregated identifier linking to the business entity responsible for the sale.
    type: integer
  - name: fk_territory
    expr: fk_territory
    agg: sum
    description: The aggregated foreign key linking to the sales territory record.
    type: integer
  - name: fk_bill_to_address
    expr: fk_bill_to_address
    agg: sum
    description: The aggregated foreign key linking to the billing address record.
    type: integer
  - name: fk_ship_to_address
    expr: fk_ship_to_address
    agg: sum
    description: The aggregated foreign key linking to the shipping address record.
    type: integer
  - name: days_to_ship
    expr: days_to_ship
    agg: sum
    description: The total aggregated count of days taken to ship the orders.
    type: numeric
  - name: delivery_delay
    expr: delivery_delay
    agg: sum
    description: The aggregated sum of delays between the expected delivery date and the actual ship date.
    type: numeric
', 'postgres');
INSERT INTO public.datasets VALUES ('92b226a7-4255-47ec-83a1-499255a09fe7', 'entity_store', 'entity_store', 'Generated model for entity_store', NULL, 'view', '/* entity_store */
DROP TABLE IF EXISTS sem.entity_store CASCADE;
CREATE TABLE sem.entity_store AS
SELECT 
    s.store_key,
    s.business_entity_id AS fk_person,
    s.name,
    s.sales_person_id,
    s.demographics,
    s.rowguid,
    s.modified_date
FROM dw.dim_store s; ', 'sem', true, false, 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2025-03-04 18:44:10.084964+00', '2025-03-04 18:44:10.084964+00', NULL, NULL, 'version: 0
models:
- name: entity_store
  data_source_name: null
  schema: sem
  database: postgres
  description: Generated model for entity_store
  model: null
  entities:
  - name: entity_person
    ref_: null
    expr: fk_person
    type: foreign
    description: Reference to the person record
    project_path: null
  dimensions:
  - name: name
    expr: name
    type: character varying
    description: Unique identifier for the store name
    searchable: false
  - name: demographics
    expr: demographics
    type: xml
    description: XML containing demographic details about the store
    searchable: false
  - name: rowguid
    expr: rowguid
    type: uuid
    description: Unique identifier for each record row
    searchable: false
  - name: modified_date
    expr: modified_date
    type: timestamp without time zone
    description: Timestamp marking the date of the last modification
    searchable: false
  measures:
  - name: store_key
    expr: store_key
    agg: sum
    description: Aggregated sum representing the unique store key
    type: integer
  - name: fk_person
    expr: fk_person
    agg: sum
    description: Aggregated sum for foreign key references to person entries
    type: integer
  - name: sales_person_id
    expr: sales_person_id
    agg: sum
    description: Aggregated sum for the sales person identifier
    type: integer
', 'postgres');


--
-- Data for Name: dataset_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: datasets_to_dataset_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: permission_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.permission_groups VALUES ('5381a3ac-9671-4318-a8d3-3dc34b7d3c42', 'Product', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '2024-11-05 15:41:13.974669+00', '2024-11-05 15:41:13.97467+00', NULL);
INSERT INTO public.permission_groups VALUES ('6840fa04-c0d7-4e0e-8d3d-ea9190d93874', 'Demo', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '2024-11-05 15:41:13.974669+00', '2024-11-05 15:55:00.592421+00', NULL);

select
  vault.create_secret('http://127.0.0.1:54321', 'project_url');
  


--
-- Data for Name: datasets_to_permission_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: entity_relationship; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: messages_deprecated; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: messages_to_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: metric_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: permission_groups_to_identities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.permission_groups_to_identities VALUES ('6840fa04-c0d7-4e0e-8d3d-ea9190d93874', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'team', '2024-11-05 15:41:13.98306+00', '2024-11-05 15:41:13.98306+00', NULL, '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874');
INSERT INTO public.permission_groups_to_identities VALUES ('5381a3ac-9671-4318-a8d3-3dc34b7d3c42', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', 'team', '2024-11-05 15:41:13.983061+00', '2024-11-05 15:41:13.983061+00', NULL, '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874');
INSERT INTO public.permission_groups_to_identities VALUES ('5381a3ac-9671-4318-a8d3-3dc34b7d3c42', '1fe85021-e799-471b-8837-953e9ae06e4c', 'user', '2024-11-05 15:41:13.983059+00', '2024-11-05 15:41:13.983059+00', NULL, '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874');


--
-- Data for Name: permission_groups_to_users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sql_evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.teams VALUES ('c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'Sales', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'none', false, false, false, false, '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '2024-11-05 15:41:13.962104+00', '2024-11-05 15:41:13.962105+00', NULL);
INSERT INTO public.teams VALUES ('6840fa04-c0d7-4e0e-8d3d-ea9190d93874', 'Product', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'none', false, false, false, false, '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '2024-11-05 15:41:13.962105+00', '2024-11-05 15:41:13.962106+00', NULL);


--
-- Data for Name: teams_to_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.teams_to_users VALUES ('c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'manager', '2024-11-05 15:41:13.964456+00', '2024-11-05 15:41:13.964457+00', NULL);
INSERT INTO public.teams_to_users VALUES ('6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '1fe85021-e799-471b-8837-953e9ae06e4c', 'member', '2024-11-05 15:41:13.964458+00', '2024-11-05 15:41:13.964458+00', NULL);


--
-- Data for Name: terms; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: terms_search; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: terms_to_datasets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: threads_deprecated; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: threads_to_dashboards; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users_to_organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users_to_organizations VALUES ('c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'workspace_admin', 'none', false, false, false, false, '2024-11-05 15:41:13.958254+00', '2024-11-05 15:41:13.958254+00', NULL, 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', NULL, 'active');
INSERT INTO public.users_to_organizations VALUES ('1fe85021-e799-471b-8837-953e9ae06e4c', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'querier', 'none', false, false, false, false, '2024-11-05 15:41:13.958255+00', '2024-11-05 15:41:13.958255+00', NULL, '1fe85021-e799-471b-8837-953e9ae06e4c', '1fe85021-e799-471b-8837-953e9ae06e4c', NULL, 'active');
INSERT INTO public.users_to_organizations VALUES ('6840fa04-c0d7-4e0e-8d3d-ea9190d93874', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce', 'data_admin', 'none', false, false, false, false, '2024-11-05 15:41:13.958256+00', '2024-11-05 15:41:13.958256+00', NULL, '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', NULL, 'active');


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Data for Name: migrations; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

INSERT INTO supabase_functions.migrations VALUES ('initial', '2025-03-04 18:41:42.548349+00');
INSERT INTO supabase_functions.migrations VALUES ('20210809183423_update_grants', '2025-03-04 18:41:42.548349+00');


--
-- Data for Name: seed_files; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

INSERT INTO supabase_migrations.seed_files VALUES ('supabase/seed.sql', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

select vault.create_secret('{"type":"postgres","host":"aws-0-us-east-1.pooler.supabase.com","port":5432,"username":"postgres.fjbidcbjvmpesoonimhl","password":"S8Jrts05EqxsfA3q","default_database":"postgres","default_schema":"sem","jump_host":null,"ssh_username":null,"ssh_private_key":null}', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: jobid_seq; Type: SEQUENCE SET; Schema: cron; Owner: supabase_admin
--

SELECT pg_catalog.setval('cron.jobid_seq', 1, true);


--
-- Name: runid_seq; Type: SEQUENCE SET; Schema: cron; Owner: supabase_admin
--

SELECT pg_catalog.setval('cron.runid_seq', 1, false);


--
-- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: supabase_admin
--

SELECT pg_catalog.setval('pgsodium.key_key_id_seq', 2, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('supabase_functions.hooks_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

update public.users set name = 'Chad' where id = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';
update public.users set name = 'Blake' where id = '1fe85021-e799-471b-8837-953e9ae06e4c';
update public.users set name = 'Nate' where id = '6840fa04-c0d7-4e0e-8d3d-ea9190d93874';
