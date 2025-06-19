dev:
	rm -rf ./next && pnpm install && pnpm run dev

build:
	rm -rf ./next && pnpm install && pnpm run build

start:
	pnpm install && pnpm run build && pnpm run start

start-fast:
	@if [ ! -d "./.next" ]; then \
		echo "No build found. Installing dependencies and building..."; \
		pnpm install && pnpm run build && pnpm run start; \
	else \
		echo "Using existing build..."; \
		pnpm run start; \
	fi

fast:
	pnpm run dev

build-storybook:
	pnpm run build-storybook

storybook:
	pnpm run storybook

lint:
	pnpm run lint

lint-fix:
	pnpm run lint-fix

