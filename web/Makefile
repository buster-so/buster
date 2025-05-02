dev:
	rm -rf ./next && npm i && npm run dev

build:
	rm -rf ./next && npm i && npm run build

start:
	npm i && npm run build && npm run start

start-fast:
	@if [ ! -d "./.next" ]; then \
		echo "No build found. Installing dependencies and building..."; \
		npm i && npm run build && npm run start; \
	else \
		echo "Using existing build..."; \
		npm run start; \
	fi

fast:
	npm run dev

build-storybook:
	npm run build-storybook

storybook:
	npm run storybook

lint:
	npm run lint

lint-fix:
	npm run lint-fix

