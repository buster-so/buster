dev:
	docker stop buster-redis-make || true && \
	docker rm buster-redis-make || true && \
	docker run -d --name buster-redis-make -p 6379:6379 -v buster_redis_data:/data redis && \
	supabase start || true && \
	supabase db reset || true && \
	export DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres && \
	diesel migration run || true && \
	PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -d postgres -U postgres -f libs/database/setup.sql || true && \
	PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -d postgres -U postgres -f libs/database/seed.sql || true && \
	export RUST_LOG=debug && \
	export CARGO_INCREMENTAL=1 && \
	nice cargo watch -C server -x run

update-seed:
	PGPASSWORD=postgres pg_dump -h 127.0.0.1 -p 54322 -U postgres -d postgres \
	--data-only --no-owner --no-privileges \
	--schema=public \
	--exclude-table=schema_migrations \
	--exclude-table=__diesel_schema_migrations \
	--exclude-table=migrations \
	--exclude-table=users \
	> libs/database/seed.sql

stop:
	docker stop buster-redis-make || true && \
	docker rm buster-redis-make || true && \
	supabase stop

fast:
	export RUST_LOG=debug && \
	export CARGO_INCREMENTAL=1 && \
	nice cargo watch -C server -x run

fast-no-migrations:
	export RUST_LOG=debug && \
	export CARGO_INCREMENTAL=1 && \
	export SKIP_MIGRATIONS=true && \
	nice cargo watch -C server -x run