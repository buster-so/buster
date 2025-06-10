dev:
	docker stop buster-redis-make || true && \
	docker rm buster-redis-make || true && \
	docker run -d --name buster-redis-make -p 6379:6379 -v buster_redis_data:/data redis && \
	supabase start || true && \
	supabase db reset || true && \
	cd ../packages/database && make dev && cd ../../server && \
	echo "Checking if electric docker service is running..."
	@if ! docker ps --format "table {{.Names}}" | grep -q "electric-server-electric-1\|electric-server_electric_1"; then \
		echo "Electric service not running. Starting docker-compose..."; \
		cd ../electric-server && docker compose up -d; \
		echo "Waiting for electric service to be ready..."; \
		timeout=180; \
		while [ $$timeout -gt 0 ]; do \
			if docker ps --format "table {{.Names}}" | grep -q "electric-server-electric-1\|electric-server_electric_1"; then \
				echo "Electric service is now running!"; \
				break; \
			fi; \
			sleep 1; \
			timeout=$$((timeout - 1)); \
		done; \
		if [ $$timeout -eq 0 ]; then \
			echo "ERROR: Electric service failed to start within 180 seconds"; \
			exit 1; \
		fi; \
	else \
		echo "Electric service is already running."; \
	fi
	echo "Starting bun dev..."
	bun --max-old-space-size=512 dev


stop:
	docker stop buster-redis-make || true && \
	docker rm buster-redis-make || true && \
	cd ../electric-server && docker compose stop && \
	supabase stop
