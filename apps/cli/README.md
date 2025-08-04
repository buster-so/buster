# Buster CLI

The official command-line interface for Buster, built with TypeScript, Commander.js, and Ink for a beautiful terminal experience.

## Architecture

This CLI is designed as a thin client that communicates with the Buster server API. It handles:
- File system operations (reading/writing YAML files)
- API communication
- Rich terminal UI using Ink (React for CLI)

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build the CLI
pnpm build

# Run tests
pnpm test
```

### Commands

- `auth` - Authenticate with Buster
- `init` - Initialize a new Buster project
- `deploy` - Deploy models to Buster
- `parse` - Parse and validate YAML model files
- `config` - Manage Buster configuration
- `update` - Update CLI to the latest version
- `start` - Start Buster services
- `stop` - Stop Buster services
- `reset` - Reset Buster services and data

### Testing

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration

# Watch mode
pnpm test:watch
```

### Building Binaries

```bash
# Build binaries for all platforms
pnpm build:binary
```

This creates standalone executables for Linux, macOS, and Windows using Bun's compile feature.

## Contributing

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines.