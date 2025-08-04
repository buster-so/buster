install: build
	mkdir -p $(HOME)/.local/bin
	cp target/release/buster-cli $(HOME)/.local/bin/buster-local
	grep -q '/.local/bin' $(HOME)/.zshrc || echo 'export PATH="$$HOME/.local/bin:$$PATH"' >> $(HOME)/.zshrc
	@echo "Run 'source ~/.zshrc' to update your current shell"

build:
	cargo build --release -p buster-cli

