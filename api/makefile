dev:
	docker compose up -d
	supabase start
	ollama serve &
	ollama pull mxbai-embed-large
	supabase db reset 
	diesel migration run && \
	PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -d postgres -U postgres -f src/database/seed.sql && \
	export RUST_LOG=debug
	export CARGO_INCREMENTAL=1
	nice cargo watch -x run

stop:
	docker compose down && \
	supabase stop && \
	pkill ollama

fast:
	export RUST_LOG=debug
	export CARGO_INCREMENTAL=1
	nice cargo watch -x run