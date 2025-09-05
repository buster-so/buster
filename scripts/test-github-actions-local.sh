#!/bin/bash

# Test GitHub Actions Locally with act
# This script helps test the GitHub Actions workflows using act

set -e

echo "🎭 Testing GitHub Actions Locally with act"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo -e "${YELLOW}act is not installed. Would you like to install it?${NC}"
    echo ""
    echo "Installation options:"
    echo "  1. macOS with Homebrew: brew install act"
    echo "  2. macOS/Linux with curl:"
    echo "     curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
    echo "  3. With Go: go install github.com/nektos/act@latest"
    echo ""
    
    # Try to detect OS and suggest best option
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${BLUE}Recommended for macOS:${NC}"
        echo "  brew install act"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo -e "${BLUE}Recommended for Linux:${NC}"
        echo "  curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
    fi
    
    exit 1
fi

echo -e "${GREEN}✓ act is installed: $(act --version)${NC}"
echo ""

# Create act configuration if it doesn't exist
if [[ ! -f ".actrc" ]]; then
    echo -e "${YELLOW}Creating .actrc configuration...${NC}"
    cat > .actrc << 'EOF'
# Default act configuration for testing
-P ubuntu-latest=catthehacker/ubuntu:act-latest
-P ubuntu-22.04=catthehacker/ubuntu:act-22.04
-P ubuntu-20.04=catthehacker/ubuntu:act-20.04
-P macos-latest=nektos/act-environments-macos:latest
-P windows-latest=catthehacker/ubuntu:act-latest
-P windows-2022=catthehacker/ubuntu:act-latest
-P blacksmith-2vcpu-ubuntu-2404=catthehacker/ubuntu:act-latest
-P blacksmith-4vcpu-ubuntu-2404=catthehacker/ubuntu:act-latest
-P blacksmith-8vcpu-ubuntu-2404=catthehacker/ubuntu:act-latest
--container-architecture linux/amd64
EOF
    echo -e "${GREEN}✓ Created .actrc configuration${NC}"
    echo ""
fi

# Create secrets file for act if it doesn't exist
if [[ ! -f ".secrets" ]]; then
    echo -e "${YELLOW}Creating .secrets file template...${NC}"
    cat > .secrets << 'EOF'
# GitHub Actions secrets for local testing
# Fill in actual values or use dummy values for testing
GITHUB_TOKEN=dummy-github-token
HOMEBREW_TAP_TOKEN=dummy-homebrew-token
EOF
    echo -e "${GREEN}✓ Created .secrets template${NC}"
    echo -e "${YELLOW}  Note: Update .secrets with actual values if needed${NC}"
    echo ""
fi

# Menu for testing different workflows
echo -e "${BLUE}Which workflow would you like to test?${NC}"
echo "  1. CLI Release - Build only (fast)"
echo "  2. CLI Release - Full workflow (includes release)"
echo "  3. Homebrew Tap Update (requires existing release)"
echo "  4. List all workflow jobs"
echo "  5. Dry run (show what would be executed)"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}Testing CLI Release - Build job only...${NC}"
        echo "This will build the CLI binary for your current platform"
        echo ""
        
        # Run only the build job for current platform
        act push \
            -W .github/workflows/cli-release.yml \
            -j build \
            --matrix os:$(uname -s | tr '[:upper:]' '[:lower:]')-latest \
            --secret-file .secrets \
            --container-architecture linux/amd64 \
            --pull=false
        ;;
        
    2)
        echo ""
        echo -e "${YELLOW}Testing CLI Release - Full workflow...${NC}"
        echo "This will simulate the entire release process"
        echo ""
        
        act push \
            -W .github/workflows/cli-release.yml \
            --secret-file .secrets \
            --container-architecture linux/amd64 \
            --pull=false
        ;;
        
    3)
        echo ""
        echo -e "${YELLOW}Testing Homebrew Tap Update...${NC}"
        echo "Enter the release tag (e.g., cli-v0.3.0):"
        read -p "Tag: " tag
        echo "Enter the version (e.g., 0.3.0):"
        read -p "Version: " version
        echo ""
        
        act workflow_dispatch \
            -W .github/workflows/update-brew-tap.yml \
            --secret-file .secrets \
            -e <(echo "{\"inputs\": {\"tag\": \"$tag\", \"version\": \"$version\"}}") \
            --container-architecture linux/amd64 \
            --pull=false
        ;;
        
    4)
        echo ""
        echo -e "${YELLOW}Listing all workflow jobs...${NC}"
        echo ""
        
        echo "CLI Release workflow jobs:"
        act -W .github/workflows/cli-release.yml -l
        echo ""
        
        echo "Homebrew Tap Update workflow jobs:"
        act -W .github/workflows/update-brew-tap.yml -l
        ;;
        
    5)
        echo ""
        echo -e "${YELLOW}Dry run - CLI Release workflow...${NC}"
        echo ""
        
        act push \
            -W .github/workflows/cli-release.yml \
            --dryrun \
            --secret-file .secrets
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
echo ""
echo "Tips:"
echo "  - Use --verbose flag for more detailed output"
echo "  - Use --reuse to keep containers between runs (faster)"
echo "  - Check .secrets file if you see authentication errors"
echo "  - Use --platform to specify different OS targets"