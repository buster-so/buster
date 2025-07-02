# Buster CLI Installation Script for Windows PowerShell
# Usage: iwr -useb https://raw.githubusercontent.com/buster-so/buster/main/scripts/install.ps1 | iex

param(
    [string]$Version = "latest"
)

$ErrorActionPreference = "Stop"

# Configuration
$REPO = "buster-so/buster"
$BINARY_NAME = "buster-cli"
$INSTALL_NAME = "buster"

# Colors for output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Get-Architecture {
    $arch = [System.Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE")
    switch ($arch) {
        "AMD64" { return "x86_64" }
        "ARM64" { return "arm64" }
        default {
            Write-Error "Unsupported architecture: $arch"
            exit 1
        }
    }
}

function Get-LatestVersion {
    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/latest"
        return $response.tag_name
    }
    catch {
        Write-Error "Failed to fetch latest version: $_"
        exit 1
    }
}

function Install-BusterCLI {
    $arch = Get-Architecture
    Write-Info "Detected architecture: $arch"
    
    # Get version if not specified
    if ($Version -eq "latest") {
        Write-Info "Fetching latest version..."
        $Version = Get-LatestVersion
        Write-Info "Latest version: $Version"
    }
    
    # Construct download URL
    $filename = "$BINARY_NAME-windows-$arch.zip"
    $downloadUrl = "https://github.com/$REPO/releases/download/$Version/$filename"
    
    Write-Info "Downloading from: $downloadUrl"
    
    # Create temporary directory
    $tempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
    $zipPath = Join-Path $tempDir $filename
    
    try {
        # Download the binary
        Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
        Write-Success "Downloaded binary successfully"
        
        # Extract the archive
        Write-Info "Extracting archive..."
        Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
        
        # Determine install directory
        $installDir = "$env:LOCALAPPDATA\Microsoft\WindowsApps"
        
        # Create install directory if it doesn't exist
        if (!(Test-Path $installDir)) {
            New-Item -ItemType Directory -Path $installDir -Force | Out-Null
        }
        
        # Move binary to install directory
        $binaryPath = Join-Path $tempDir "$BINARY_NAME.exe"
        $targetPath = Join-Path $installDir "$INSTALL_NAME.exe"
        
        if (!(Test-Path $binaryPath)) {
            Write-Error "Binary not found after extraction: $binaryPath"
            exit 1
        }
        
        # Remove existing binary if it exists
        if (Test-Path $targetPath) {
            Remove-Item $targetPath -Force
        }
        
        Move-Item $binaryPath $targetPath
        Write-Success "Installed $INSTALL_NAME to $targetPath"
        
        # Verify installation
        Write-Info "Verifying installation..."
        Start-Sleep -Seconds 1
        
        try {
            $versionOutput = & $INSTALL_NAME --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Installation verified! $versionOutput"
            } else {
                Write-Success "Installation successful! Binary is available as '$INSTALL_NAME'"
            }
        }
        catch {
            Write-Warning "Binary installed but verification failed. You may need to restart your terminal."
        }
        
        Write-Success "🎉 Installation complete!"
        Write-Info "You can now use the '$INSTALL_NAME' command to interact with the Buster CLI"
        Write-Info "Try running: $INSTALL_NAME --help"
        
    }
    finally {
        # Clean up temporary directory
        if (Test-Path $tempDir) {
            Remove-Item $tempDir -Recurse -Force
        }
    }
}

function Show-Help {
    Write-Host @"
Buster CLI Installation Script for Windows PowerShell

Usage: 
    .\install.ps1 [-Version <version>]
    iwr -useb https://raw.githubusercontent.com/buster-so/buster/main/scripts/install.ps1 | iex

Parameters:
    -Version    Install specific version (default: latest)

Examples:
    .\install.ps1                    # Install latest version
    .\install.ps1 -Version v1.0.0    # Install specific version

"@
}

# Main execution
if ($args -contains "--help" -or $args -contains "-h") {
    Show-Help
    exit 0
}

Write-Host ""
Write-Info "🚀 Buster CLI Installation Script for Windows"
Write-Info "This script will download and install the latest Buster CLI binary"
Write-Host ""

try {
    Install-BusterCLI
}
catch {
    Write-Error "Installation failed: $_"
    exit 1
} 