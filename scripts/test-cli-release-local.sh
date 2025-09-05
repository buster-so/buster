#!/bin/bash

# Test CLI Release Locally
# This script simulates the GitHub Actions workflow for building the CLI

set -e

echo "🚀 Testing CLI Release Build Process Locally"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

echo -e "${YELLOW}System Info:${NC}"
echo "  OS: $OS"
echo "  Architecture: $ARCH"
echo ""

# Determine the target based on OS and architecture
if [[ "$OS" == "darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        TARGET="darwin-arm64"
        BUN_TARGET="darwin-arm64"
        ARTIFACT_NAME="buster-cli-darwin-arm64.tar.gz"
    else
        TARGET="darwin-x64"
        BUN_TARGET="darwin-x64"
        ARTIFACT_NAME="buster-cli-darwin-x86_64.tar.gz"
    fi
elif [[ "$OS" == "linux" ]]; then
    TARGET="linux-x64"
    BUN_TARGET="linux-x64-modern"
    ARTIFACT_NAME="buster-cli-linux-x86_64.tar.gz"
else
    echo -e "${RED}Unsupported OS: $OS${NC}"
    exit 1
fi

echo -e "${GREEN}Build Configuration:${NC}"
echo "  Target: $TARGET"
echo "  Bun Target: $BUN_TARGET"
echo "  Artifact: $ARTIFACT_NAME"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}✗ pnpm is not installed${NC}"
    echo "  Install with: npm install -g pnpm"
    exit 1
else
    echo -e "${GREEN}✓ pnpm$(pnpm --version)${NC}"
fi

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${RED}✗ bun is not installed${NC}"
    echo "  Install with: curl -fsSL https://bun.sh/install | bash"
    exit 1
else
    echo -e "${GREEN}✓ bun $(bun --version)${NC}"
fi

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d "apps/cli" ]]; then
    echo -e "${RED}✗ Not in monorepo root directory${NC}"
    echo "  Please run this script from the repository root"
    exit 1
else
    echo -e "${GREEN}✓ In monorepo root${NC}"
fi

echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
pnpm install --frozen-lockfile
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Build dependencies with Turbo
echo -e "${YELLOW}Step 3: Building CLI dependencies with Turbo...${NC}"
export NODE_ENV=production
export SKIP_ENV_CHECK=true
export TURBO_TELEMETRY_DISABLED=1

pnpm turbo run build --filter=@buster-app/cli^...
echo -e "${GREEN}✓ Dependencies built${NC}"
echo ""

# Step 4: Build standalone CLI binary
echo -e "${YELLOW}Step 4: Building standalone CLI binary...${NC}"
cd apps/cli

# Clean previous builds
rm -rf dist
mkdir -p dist

echo "Building standalone binary..."
# Note: Bun's --compile currently builds for the host platform
# Cross-compilation requires using Bun on the target platform
bun build src/index.tsx --compile --outfile dist/buster-cli

# Make it executable
chmod +x dist/buster-cli

# Check binary size
BINARY_SIZE=$(ls -lh dist/buster-cli | awk '{print $5}')
echo -e "${GREEN}✓ Binary built successfully (size: $BINARY_SIZE)${NC}"
echo ""

# Step 5: Test the binary
echo -e "${YELLOW}Step 5: Testing the binary...${NC}"

# Test --help
echo "Testing --help command..."
if ./dist/buster-cli --help > /dev/null 2>&1; then
    echo -e "${GREEN}✓ --help command works${NC}"
else
    echo -e "${YELLOW}⚠ --help command not implemented or failed${NC}"
fi

# Test --version
echo "Testing --version command..."
if ./dist/buster-cli --version > /dev/null 2>&1; then
    echo -e "${GREEN}✓ --version command works${NC}"
else
    echo -e "${YELLOW}⚠ --version command not implemented or failed${NC}"
fi

echo ""

# Step 6: Create release archive
echo -e "${YELLOW}Step 6: Creating release archive...${NC}"

cd dist

# Rename to 'buster' for end users
cp buster-cli buster

# Create tarball
tar czf "$ARTIFACT_NAME" buster

# Generate SHA256
if [[ "$OS" == "darwin" ]]; then
    shasum -a 256 "$ARTIFACT_NAME" > "$ARTIFACT_NAME.sha256"
else
    sha256sum "$ARTIFACT_NAME" > "$ARTIFACT_NAME.sha256"
fi

echo -e "${GREEN}✓ Archive created: $ARTIFACT_NAME${NC}"
echo -e "${GREEN}✓ Checksum created: $ARTIFACT_NAME.sha256${NC}"

# Display checksum
echo ""
echo "SHA256 Checksum:"
cat "$ARTIFACT_NAME.sha256"

# Display archive size
ARCHIVE_SIZE=$(ls -lh "$ARTIFACT_NAME" | awk '{print $5}')
echo ""
echo "Archive size: $ARCHIVE_SIZE"

cd ../../..

echo ""
echo -e "${GREEN}✅ Local CLI build test completed successfully!${NC}"
echo ""
echo "Artifacts created in: apps/cli/dist/"
echo "  - Binary: apps/cli/dist/buster-cli"
echo "  - Archive: apps/cli/dist/$ARTIFACT_NAME"
echo "  - Checksum: apps/cli/dist/$ARTIFACT_NAME.sha256"
echo ""
echo "To test the binary directly:"
echo "  ./apps/cli/dist/buster-cli --help"
echo ""
echo "To extract and test the archive:"
echo "  cd /tmp && tar xzf $(pwd)/apps/cli/dist/$ARTIFACT_NAME && ./buster --help"