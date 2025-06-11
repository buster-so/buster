include ../../.env
export

dev:
	supabase start && \
	supabase db reset && \
	bun run setup:setup

stop:
	supabase stop