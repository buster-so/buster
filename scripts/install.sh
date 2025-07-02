#!/bin/bash
set -e

# Buster CLI Installation Script
# Usage: curl -fsSL https://raw.githubusercontent.com/buster-so/buster/main/scripts/install.sh | bash

REPO="buster-so/buster"
BINARY_NAME="buster-cli"
INSTALL_NAME="buster"
VERSION="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS and architecture
detect_platform() {
    local os=""
    local arch=""
    local ext=""
    
    # Detect OS
    case "$(uname -s)" in
        Darwin*)
            os="darwin"
            ;;
        Linux*)
            os="linux"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            os="windows"
            ;;
        *)
            print_error "Unsupported operating system: $(uname -s)"
            exit 1
            ;;
    esac
    
    # Detect architecture
    case "$(uname -m)" in
        x86_64|amd64)
            arch="x86_64"
            ;;
        arm64|aarch64)
            if [[ "$os" == "darwin" ]]; then
                arch="arm64"
            else
                arch="aarch64"
            fi
            ;;
        *)
            print_error "Unsupported architecture: $(uname -m)"
            exit 1
            ;;
    esac
    
    # Set file extension
    if [[ "$os" == "windows" ]]; then
        ext="zip"
    else
        ext="tar.gz"
    fi
    
    echo "${os}-${arch}.${ext}"
}

# Get the latest release version
get_latest_version() {
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/'
    elif command -v wget >/dev/null 2>&1; then
        wget -qO- "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/'
    else
        print_error "Neither curl nor wget is available. Please install one of them."
        exit 1
    fi
}

# Download and install
install_cli() {
    local platform_suffix=$(detect_platform)
    local os=$(echo "$platform_suffix" | cut -d'-' -f1)
    local arch=$(echo "$platform_suffix" | cut -d'-' -f2 | cut -d'.' -f1)
    
    print_status "Detected platform: $os ($arch)"
    
    # Get version if not specified
    if [[ "$VERSION" == "latest" ]]; then
        print_status "Fetching latest version..."
        VERSION=$(get_latest_version)
        if [[ -z "$VERSION" ]]; then
            print_error "Failed to fetch latest version"
            exit 1
        fi
        print_status "Latest version: $VERSION"
    fi
    
    # Construct download URL
    local filename="${BINARY_NAME}-${platform_suffix}"
    local download_url="https://github.com/${REPO}/releases/download/${VERSION}/${filename}"
    
    print_status "Downloading from: $download_url"
    
    # Create temporary directory
    local tmp_dir=$(mktemp -d)
    trap "rm -rf $tmp_dir" EXIT
    
    # Download the binary
    if command -v curl >/dev/null 2>&1; then
        if ! curl -fsSL "$download_url" -o "$tmp_dir/$filename"; then
            print_error "Failed to download binary"
            exit 1
        fi
    elif command -v wget >/dev/null 2>&1; then
        if ! wget -q "$download_url" -O "$tmp_dir/$filename"; then
            print_error "Failed to download binary"
            exit 1
        fi
    else
        print_error "Neither curl nor wget is available"
        exit 1
    fi
    
    print_success "Downloaded binary successfully"
    
    # Extract and install based on OS
    if [[ "$os" == "windows" ]]; then
        install_windows "$tmp_dir/$filename"
    else
        install_unix "$tmp_dir/$filename" "$os"
    fi
}

# Install on Unix-like systems (macOS, Linux)
install_unix() {
    local archive_path="$1"
    local os="$2"
    
    print_status "Extracting archive..."
    
    # Extract the archive
    if ! tar -xzf "$archive_path" -C "$(dirname "$archive_path")"; then
        print_error "Failed to extract archive"
        exit 1
    fi
    
    # Determine install directory
    local install_dir="$HOME/.local/bin"
    
    # Create install directory if it doesn't exist
    mkdir -p "$install_dir"
    
    # Move binary to install directory
    local binary_path="$(dirname "$archive_path")/$BINARY_NAME"
    if [[ ! -f "$binary_path" ]]; then
        print_error "Binary not found after extraction: $binary_path"
        exit 1
    fi
    
    if ! mv "$binary_path" "$install_dir/$INSTALL_NAME"; then
        print_error "Failed to move binary to $install_dir"
        exit 1
    fi
    
    # Make binary executable
    chmod +x "$install_dir/$INSTALL_NAME"
    
    print_success "Installed $INSTALL_NAME to $install_dir/$INSTALL_NAME"
    
    # Check if install directory is in PATH
    if [[ ":$PATH:" != *":$install_dir:"* ]]; then
        print_warning "$install_dir is not in your PATH"
        print_status "Add the following line to your shell configuration file (~/.bashrc, ~/.zshrc, etc.):"
        echo
        echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
        echo
        print_status "Then restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
    else
        print_success "$install_dir is already in your PATH"
    fi
}

# Install on Windows (using Git Bash/MSYS2/Cygwin)
install_windows() {
    local archive_path="$1"
    
    print_status "Extracting archive..."
    
    # Extract zip file
    if ! unzip -q "$archive_path" -d "$(dirname "$archive_path")"; then
        print_error "Failed to extract archive"
        exit 1
    fi
    
    # Determine install directory (use Windows-friendly location)
    local install_dir="$LOCALAPPDATA/Microsoft/WindowsApps"
    
    # Create install directory if it doesn't exist
    mkdir -p "$install_dir"
    
    # Move binary to install directory
    local binary_path="$(dirname "$archive_path")/${BINARY_NAME}.exe"
    if [[ ! -f "$binary_path" ]]; then
        print_error "Binary not found after extraction: $binary_path"
        exit 1
    fi
    
    if ! mv "$binary_path" "$install_dir/${INSTALL_NAME}.exe"; then
        print_error "Failed to move binary to $install_dir"
        exit 1
    fi
    
    print_success "Installed $INSTALL_NAME to $install_dir/${INSTALL_NAME}.exe"
    print_status "The binary should be available in your PATH automatically"
    print_status "You may need to restart your terminal for changes to take effect"
}

# Verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    # Wait a moment for PATH changes to take effect
    sleep 1
    
    if command -v "$INSTALL_NAME" >/dev/null 2>&1; then
        local version_output
        if version_output=$("$INSTALL_NAME" --version 2>/dev/null); then
            print_success "Installation verified! $version_output"
        else
            print_success "Installation successful! Binary is available as '$INSTALL_NAME'"
        fi
    else
        print_warning "Binary installed but not found in PATH. You may need to:"
        print_status "1. Restart your terminal"
        print_status "2. Add the install directory to your PATH"
        print_status "3. Run 'source ~/.bashrc' (or ~/.zshrc)"
    fi
}

# Main execution
main() {
    echo
    print_status "🚀 Buster CLI Installation Script"
    print_status "This script will download and install the latest Buster CLI binary"
    echo
    
    # Check for required tools
    if ! command -v tar >/dev/null 2>&1 && [[ "$(uname -s)" != "CYGWIN"* && "$(uname -s)" != "MINGW"* ]]; then
        print_error "tar is required but not installed"
        exit 1
    fi
    
    if [[ "$(uname -s)" == "CYGWIN"* || "$(uname -s)" == "MINGW"* ]]; then
        if ! command -v unzip >/dev/null 2>&1; then
            print_error "unzip is required but not installed"
            exit 1
        fi
    fi
    
    # Install the CLI
    install_cli
    
    # Verify installation
    verify_installation
    
    echo
    print_success "🎉 Installation complete!"
    print_status "You can now use the 'buster' command to interact with the Buster CLI"
    print_status "Try running: buster --help"
    echo
}

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            VERSION="$2"
            shift 2
            ;;
        --help)
            echo "Buster CLI Installation Script"
            echo
            echo "Usage: $0 [OPTIONS]"
            echo
            echo "Options:"
            echo "  --version VERSION    Install specific version (default: latest)"
            echo "  --help              Show this help message"
            echo
            echo "Examples:"
            echo "  $0                  # Install latest version"
            echo "  $0 --version v1.0.0 # Install specific version"
            echo
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main 