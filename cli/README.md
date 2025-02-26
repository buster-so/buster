# Buster CLI

A powerful command-line interface for managing semantic models in Buster. Deploy and manage your data models with ease, whether they're standalone or part of a dbt project.

## Installation

Choose the installation command for your operating system:

### macOS (x86_64)
```bash
mkdir -p ~/.local/bin && curl -L https://github.com/buster-so/buster/releases/latest/download/buster-cli-darwin-x86_64.tar.gz | tar xz && mv buster-cli ~/.local/bin/buster && chmod +x ~/.local/bin/buster
```

### macOS (ARM/Apple Silicon)
```bash
mkdir -p ~/.local/bin && curl -L https://github.com/buster-so/buster/releases/latest/download/buster-cli-darwin-arm64.tar.gz | tar xz && mv buster-cli ~/.local/bin/buster && chmod +x ~/.local/bin/buster
```

### Linux (x86_64)
```bash
mkdir -p ~/.local/bin && curl -L https://github.com/buster-so/buster/releases/latest/download/buster-cli-linux-x86_64.tar.gz | tar xz && mv buster-cli ~/.local/bin/buster && chmod +x ~/.local/bin/buster
```

> **Note**: After installation, make sure `~/.local/bin` is in your PATH. Add this to your shell's config file (`.bashrc`, `.zshrc`, etc.):
> ```bash
> export PATH="$HOME/.local/bin:$PATH"
> ```

### Windows (x86_64)
1. Download the Windows binary:
```powershell
Invoke-WebRequest -Uri https://github.com/buster-so/buster/releases/latest/download/buster-cli-windows-x86_64.zip -OutFile buster.zip
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
- `--flat-structure`: Output YML files in a flat structure instead of maintaining directory hierarchy

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
- `--recursive`: Recursively search for model files in subdirectories (defaults to true)

Examples:
```bash
# Deploy all models in current directory
buster deploy

# Deploy a specific model or directory
buster deploy --path ./models/customers.yml

# Validate deployment without applying changes
buster deploy --dry-run

# Deploy only models in the specified directory (not recursively)
buster deploy --path ./models --recursive=false
```

The deploy command will:
1. Discover all YAML model files in the specified path
2. Load and validate the models
3. Check for excluded models based on tags
4. Validate cross-project references
5. Deploy the models to Buster
6. Provide detailed validation feedback and error messages

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
  - "customers.sql"             # Exclude a specific file
exclude_tags:                     # Optional list of tags to exclude from deployment
  - "staging"                    # Exclude models with the 'staging' tag
  - "test"                       # Exclude models with the 'test' tag
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
- `exclude_tags`: (Optional) List of tags to exclude from deployment
  - Looks for tags in SQL files in dbt format: `{{ config(tags=['tag1', 'tag2']) }}`
  - Useful for excluding staging models, test models, etc.
  - Case-insensitive matching

### Model Definition Example

```yaml
# models/customers.yml
version: 1
models:
  - name: customers
    description: "Core customer data model"
    data_source_name: "my_warehouse"  # Overrides buster.yml
    schema: "analytics"               # Overrides buster.yml
    database: "prod"                  # Overrides buster.yml
    
    entities:
      - name: customer_id
        expr: "id"
        type: "primary"
        description: "Primary customer identifier"
      - name: order
        expr: "order_id"
        type: "foreign"
        description: "Reference to order model"
        # Optional: reference to another model in a different project
        project_path: "path/to/other/project"
        # Optional: specify a different name for the referenced model
        ref: "orders"
    
    dimensions:
      - name: email
        expr: "email"
        type: "string"
        description: "Customer email address"
        searchable: true  # Optional: make this dimension searchable
    
    measures:
      - name: total_customers
        expr: "customer_id"
        agg: "count_distinct"
        description: "Total number of unique customers"
        type: "integer"  # Optional: specify the data type
```

## Cross-Project References

Buster CLI supports referencing models across different projects, enabling you to build complex data relationships:

```yaml
entities:
  - name: user_model
    expr: "user_id"
    type: "foreign"
    description: "Reference to user model in another project"
    project_path: "path/to/user/project"
    ref: "users"  # Optional: specify a different name for the referenced model
```

When using cross-project references, the CLI will:
1. Validate that the referenced project exists
2. Check for a valid buster.yml in the referenced project
3. Verify that the data sources match between projects
4. Confirm that the referenced model exists in the target project

This enables you to organize your models into logical projects while maintaining relationships between them.

## Tag-Based Exclusion

You can exclude models from deployment based on tags in your SQL files. This is useful for excluding staging models, test models, or any other models you don't want to deploy.

In your SQL files, add tags using the dbt format:

```sql
{{ config(
    tags=['staging', 'test']
) }}

SELECT * FROM source_table
```

Then in your buster.yml, specify which tags to exclude:

```yaml
exclude_tags:
  - "staging"
  - "test"
```

During deployment, any model with matching tags will be automatically excluded.

## File and Tag Exclusions

Buster CLI provides a unified way to exclude files from processing across all commands. You can specify exclusions in your `buster.yml` file:

```yaml
data_source_name: "my_data_source"
schema: "my_schema"
database: "my_database"
exclude_files:
  - "**/*_temp.sql"
  - "staging/**/*.sql"
  - "tests/**/*.yml"
exclude_tags:
  - "test"
  - "deprecated"
  - "wip"
```

### Exclude Files

The `exclude_files` section allows you to specify glob patterns for files that should be excluded from processing. This works for any command that processes files.

Common patterns:
- `"**/*_temp.sql"` - Exclude any SQL file ending with _temp.sql in any directory
- `"staging/**/*.sql"` - Exclude all SQL files in the staging directory and its subdirectories
- `"test_*.yml"` - Exclude all YAML files starting with test_

### Exclude Tags

The `exclude_tags` section allows you to exclude files based on tags specified in the file content. This is useful for excluding files that are marked as test, deprecated, etc.

Tags are specified in the SQL files using the format: `-- tags = ['tag1', 'tag2']`

When a file contains any of the excluded tags, it will be skipped by all commands.

## Best Practices

1. **Organization**
   - Keep YAML files in `models/`
   - Keep SQL files in `sql/`
   - Use `buster.yml` for shared settings
   - Group related models into subdirectories

2. **Model Generation**
   - Start with clean SQL files
   - Generate models first before customizing
   - Review generated models before deployment
   - Use tags to organize and filter models

3. **Deployment**
   - Use `--dry-run` to validate changes
   - Deploy frequently to catch issues early
   - Keep model and SQL files in sync
   - Use cross-project references for complex relationships

4. **Validation**
   - Ensure all models have descriptions
   - Validate cross-project references before deployment
   - Check for missing dependencies
   - Review validation errors carefully

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
   - Check for excluded files or tags

3. **Deployment Issues**
   - Validate YAML syntax
   - Check for missing dependencies
   - Verify data source connectivity
   - Look for cross-project reference errors
   - Check for tag-based exclusions

4. **Cross-Project Reference Issues**
   - Ensure the referenced project exists
   - Verify the referenced project has a valid buster.yml
   - Check that data sources match between projects
   - Confirm the referenced model exists in the target project

## License

MIT License - see [LICENSE](LICENSE) for details.
