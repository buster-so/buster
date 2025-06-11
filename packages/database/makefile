include ../../.env
export

dev:
	supabase start && \
	supabase db reset && \
	bun run db:setup

stop:
	supabase stop