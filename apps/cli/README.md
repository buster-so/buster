# Buster CLI (TypeScript)

A modern TypeScript-based CLI built with Bun, Commander.js, and React Ink for interactive terminal UIs.

## Quick Start - Local Testing

### 1. Install Dependencies
```bash
cd apps/cli
bun install
```

### 2. Run in Development Mode (with hot reload)
```bash
# Watch mode - automatically restarts on changes
bun run dev hello
bun run dev hello Claude --uppercase
bun run dev interactive
```

### 3. Build and Test the CLI
```bash
# Build the CLI
bun run build

# Test the built version
bun run start hello
bun run start interactive
```

### 4. Create Standalone Executable
```bash
# Build a standalone binary (no Bun required on target machine)
bun run build:standalone

# Test the standalone executable
./dist/buster hello
./dist/buster interactive
```

## Available Commands

- `hello [name]` - Simple greeting command
  - Options: `-u, --uppercase` - Output in uppercase
  - Example: `bun run dev hello Claude --uppercase`

- `interactive` - Interactive menu demo using React Ink
  - Use arrow keys to navigate
  - Press Enter to select
  - Press Q or Escape to quit

## Development Workflow

### Hot Reload Development
```bash
# This watches for changes and auto-restarts
bun run --watch src/index.tsx hello
```

### Direct Execution (fastest for development)
```bash
# Run directly with Bun
bun src/index.tsx hello
bun src/index.tsx interactive
```

### Testing Different Build Outputs
```bash
# Test as Node.js script
bun run build
node dist/index.js hello

# Test as standalone executable
bun run build:standalone
./dist/buster hello
```

## Project Structure
```
apps/cli/
├── src/
│   ├── index.tsx          # Entry point with Commander setup
│   ├── commands/          # Command implementations
│   │   ├── hello.tsx      # Basic command with Ink
│   │   └── interactive.tsx # Interactive UI demo
│   ├── components/        # Reusable Ink components
│   └── utils/            # Helper utilities
├── dist/                  # Build output
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies

- **Bun** - JavaScript runtime and bundler
- **Commander.js** - Command-line interface framework
- **React Ink** - React for interactive terminal UIs
- **TypeScript** - Type safety
- **Chalk** - Terminal styling