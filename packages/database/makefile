dev:
	source .env && \
	supabase start && \
	supabase db reset && \
	bun run setup:setup

stop:
	supabase stop