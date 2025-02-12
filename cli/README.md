# Buster CLI

A powerful command-line interface for managing semantic models in Buster. Deploy and manage your data models with ease, whether they're standalone or part of a dbt project.

## Installation

Choose the installation command for your operating system:

### macOS (x86_64)
```bash
mkdir -p ~/.local/bin && curl -L https://github.com/buster-so/buster/releases/download/v0.0.1/buster-cli-darwin-x86_64.tar.gz | tar xz && mv buster-cli ~/.local/bin/buster && chmod +x ~/.local/bin/buster
```

### macOS (ARM/Apple Silicon)
```bash
mkdir -p ~/.local/bin && curl -L https://github.com/buster-so/buster/releases/download/v0.0.1/buster-cli-darwin-arm64.tar.gz | tar xz && mv buster-cli ~/.local/bin/buster && chmod +x ~/.local/bin/buster
```

### Linux (x86_64)
```bash
mkdir -p ~/.local/bin && curl -L https://github.com/buster-so/buster/releases/download/v0.0.1/buster-cli-linux-x86_64.tar.gz | tar xz && mv buster-cli ~/.local/bin/buster && chmod +x ~/.local/bin/buster
```

> **Note**: After installation, make sure `~/.local/bin` is in your PATH. Add this to your shell's config file (`.bashrc`, `.zshrc`, etc.):
> ```bash
> export PATH="$HOME/.local/bin:$PATH"
> ```

### Windows (x86_64)
1. Download the Windows binary:
```powershell
Invoke-WebRequest -Uri https://github.com/buster-so/buster/releases/download/v0.0.1/buster-cli-windows-x86_64.zip -OutFile buster.zip
```

2. Extract and install:
```powershell
Expand-Archive -Path buster.zip -DestinationPath $env:USERPROFILE\buster
Move-Item -Path $env:USERPROFILE\buster\buster-cli.exe -Destination $env:LOCALAPPDATA\Microsoft\WindowsApps\buster.exe
```

## Quick Start Guide

### 1. Authentication

First, authenticate with Buster using your API key:

```bash
buster auth
```

This will prompt you for:
- API Key (required) - Get this from the Buster Platform
- Host (optional) - Defaults to production if not specified

You can also configure authentication using environment variables:
```bash
# Set API key via environment variable
export BUSTER_API_KEY=your_api_key_here

# Optional: Set custom host. For self-hosted instances.
export BUSTER_HOST=your_custom_host
```

The CLI will check for these environment variables in the following order:
1. Command line arguments
2. Environment variables
3. Interactive prompt

This is particularly useful for:
- CI/CD environments
- Automated scripts
- Development workflows where you don't want to enter credentials repeatedly

### 2. Generate Models

Generate Buster YAML models from your existing SQL files:

```bash
buster generate
```

Key flags for generation:
- `--source-path`: Directory containing your SQL files (defaults to current directory)
- `--destination-path`: Where to output the generated YAML files (defaults to current directory)
- `--data-source-name`: Name of the data source to use in the models
- `--schema`: Database schema name
- `--database`: Database name

The generate command will:
- Scan the source directory for SQL files
- Create corresponding YAML model files
- Create a `buster.yml` configuration file if it doesn't exist
- Preserve any existing model customizations

Example with all options:
```bash
buster generate \
  --source-path ./sql \
  --destination-path ./models \
  --data-source-name my_warehouse \
  --schema analytics \
  --database prod
```

### 3. Deploy Models

Deploy your models to Buster:

```bash
buster deploy
```

Deploy options:
- `--path`: Specific path to deploy (defaults to current directory)
- `--dry-run`: Validate the deployment without actually deploying (defaults to false)

Examples:
```bash
# Deploy all models in current directory
buster deploy

# Deploy a specific model or directory
buster deploy --path ./models/customers.yml

# Validate deployment without applying changes
buster deploy --dry-run
```

## Project Structure

A typical Buster project structure:

```
your-project/
├── buster.yml          # Global configuration
├── models/            # Your semantic model definitions
│   ├── customers.yml
│   ├── orders.yml
│   └── products.yml
└── sql/              # SQL definitions
    ├── customers.sql
    ├── orders.sql
    └── products.sql
```

### Configuration (buster.yml)

```yaml
# buster.yml
data_source_name: "my_warehouse"  # Your default data source
schema: "analytics"               # Default schema for models
database: "prod"                  # Optional database name
exclude_files:                    # Optional list of files to exclude from generation
  - "temp_*.sql"                 # Exclude all SQL files starting with temp_
  - "test/**/*.sql"             # Exclude all SQL files in test directories
  - "customers.sql"         # Exclude a specific file
```

The configuration supports the following fields:
- `data_source_name`: (Required) Default data source for your models
- `schema`: (Required) Default schema for your models
- `database`: (Optional) Default database name
- `exclude_files`: (Optional) List of glob patterns for files to exclude from generation
  - Supports standard glob patterns (*, **, ?, etc.)
  - Matches against relative paths from source directory
  - Common use cases:
    - Excluding temporary files: `temp_*.sql`
    - Excluding test files: `test/**/*.sql`
    - Excluding specific files: `customers.sql`
    - Excluding files in directories: `archive/**/*.sql`

### Model Definition Example

```yaml
# models/customers.yml
version: 1
models:
  - name: customers
    description: "Core customer data model"
    data_source_name: "my_warehouse"
    schema: "analytics"
    
    entities:
      - name: customer_id
        expr: "id"
        type: "primary"
        description: "Primary customer identifier"
    
    dimensions:
      - name: email
        expr: "email"
        type: "string"
        description: "Customer email address"
    
    measures:
      - name: total_customers
        expr: "customer_id"
        agg: "count_distinct"
        description: "Total number of unique customers"
```

## Best Practices

1. **Organization**
   - Keep YAML files in `models/`
   - Keep SQL files in `sql/`
   - Use `buster.yml` for shared settings

2. **Model Generation**
   - Start with clean SQL files
   - Generate models first before customizing
   - Review generated models before deployment

3. **Deployment**
   - Use `--dry-run` to validate changes
   - Deploy frequently to catch issues early
   - Keep model and SQL files in sync

## Troubleshooting

Common issues and solutions:

1. **Authentication Issues**
   - Verify your API key is correct
   - Check if the host is properly specified (if using non-production)
   - Ensure network connectivity to Buster

2. **Generation Issues**
   - Verify SQL files are in the correct location
   - Check file permissions
   - Ensure SQL syntax is valid

3. **Deployment Issues**
   - Validate YAML syntax
   - Check for missing dependencies
   - Verify data source connectivity

## License

MIT License - see [LICENSE](LICENSE) for details.
