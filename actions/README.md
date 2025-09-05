# Buster GitHub Actions

Official GitHub Actions for working with the Buster CLI and deploying semantic models to the Buster platform.

## Quick Start

```yaml
name: Deploy to Buster
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: buster-so/buster/actions/install@v1
      
      - uses: buster-so/buster/actions/deploy@v1
        env:
          BUSTER_API_KEY: ${{ secrets.BUSTER_API_KEY }}
```

## Available Actions

### 🔧 Install Buster CLI

```yaml
- uses: buster-so/buster/actions/install@v1
  with:
    version: latest  # or specific version like 'v0.3.0'
```

Downloads and installs the Buster CLI for your workflow.

### 🚀 Deploy to Buster

```yaml
- uses: buster-so/buster/actions/deploy@v1
  env:
    BUSTER_API_KEY: ${{ secrets.BUSTER_API_KEY }}
  with:
    environment: production
    directory: ./models
```

Deploys your semantic models to Buster.

### ✅ Validate Models (Dry Run)

```yaml
- uses: buster-so/buster/actions/dry-run@v1
  env:
    BUSTER_API_KEY: ${{ secrets.BUSTER_API_KEY }}
  with:
    fail-on-warnings: true
```

Validates your models without deploying them. Perfect for pull requests!

## Setup

### 1. Add API Key Secret

1. Go to your repository's **Settings** → **Secrets and variables** → **Actions**
2. Add a new secret called `BUSTER_API_KEY`
3. Paste your Buster API key as the value

### 2. Create Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Buster

on:
  push:
    branches: [main]
    paths:
      - 'models/**'
      - 'buster.yml'
  pull_request:
    paths:
      - 'models/**'
      - 'buster.yml'

jobs:
  validate:
    name: Validate Models
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: buster-so/buster/actions/install@v1
      - uses: buster-so/buster/actions/dry-run@v1
        env:
          BUSTER_API_KEY: ${{ secrets.BUSTER_API_KEY }}

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: buster-so/buster/actions/install@v1
      - uses: buster-so/buster/actions/deploy@v1
        env:
          BUSTER_API_KEY: ${{ secrets.BUSTER_API_KEY }}
```

## Action Reference

### install

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | CLI version to install | No | `latest` |

### deploy

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `directory` | Directory with buster.yml | No | `.` |
| `environment` | Target environment | No | `''` |
| `force` | Skip confirmation prompts | No | `true` |
| `verbose` | Enable verbose output | No | `false` |

**Environment Variables:**
- `BUSTER_API_KEY` (required)
- `BUSTER_HOST` (optional, defaults to `https://api.buster.so`)

### dry-run

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `directory` | Directory with buster.yml | No | `.` |
| `environment` | Target environment | No | `''` |
| `verbose` | Enable verbose output | No | `true` |
| `fail-on-warnings` | Fail if warnings found | No | `false` |

**Environment Variables:**
- `BUSTER_API_KEY` (required)
- `BUSTER_HOST` (optional)

## Examples

### Multi-Environment Deployment

```yaml
name: Deploy to Environment
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [development, staging, production]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      - uses: buster-so/buster/actions/install@v1
      - uses: buster-so/buster/actions/deploy@v1
        env:
          BUSTER_API_KEY: ${{ secrets.BUSTER_API_KEY }}
        with:
          environment: ${{ inputs.environment }}
```

### PR Validation with Comments

```yaml
name: Validate PR
on: pull_request

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: buster-so/buster/actions/install@v1
      
      - id: validate
        uses: buster-so/buster/actions/dry-run@v1
        env:
          BUSTER_API_KEY: ${{ secrets.BUSTER_API_KEY }}
      
      - uses: actions/github-script@v7
        if: always()
        with:
          script: |
            const status = '${{ steps.validate.outputs.validation-status }}';
            const errors = '${{ steps.validate.outputs.errors-count }}';
            const warnings = '${{ steps.validate.outputs.warnings-count }}';
            
            let message = '✅ Validation passed!';
            if (status === 'failed') {
              message = `❌ Validation failed with ${errors} error(s)`;
            } else if (status === 'warnings') {
              message = `⚠️ Validation passed with ${warnings} warning(s)`;
            }
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: message
            });
```

## Supported Platforms

All actions work on:
- ✅ Ubuntu (recommended)
- ✅ macOS
- ✅ Windows

## License

MIT

## Support

- **Issues**: [GitHub Issues](https://github.com/buster-so/buster-actions/issues)
- **Documentation**: [docs.buster.so](https://docs.buster.so)
- **CLI**: [github.com/buster-so/buster](https://github.com/buster-so/buster)