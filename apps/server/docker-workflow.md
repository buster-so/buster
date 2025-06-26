# Buster Server Docker Workflow
Two-step build process for maximum efficiency

## 🔐 GitHub Container Registry Setup

First, authenticate with GitHub Container Registry:

- The password to login must be a github access token (made with token classic) with write and write package permissions

```bash
docker login ghcr.io
```

## 🏗️ Step 1: Build & Publish Base Image (Do this occasionally)

The base image contains all heavy dependencies and build tools.

```bash
# Build the base image with all dependencies
docker build -f apps/server/Dockerfile.custom-base -t ghcr.io/buster-so/server-base:latest .

# Publish to GitHub Container Registry
docker push ghcr.io/buster-so/server-base:latest
```

**When to rebuild the base:**
- Major dependency updates
- New packages added to workspace
- Tool version updates (pnpm, bun)
- Weekly/monthly maintenance

## ⚡ Step 2: Ultra-Fast App Builds (CI/CD)

Use the published base for lightning-fast builds:

```bash
# Pull the latest base (in CI/CD)
docker pull ghcr.io/buster-so/buster-server-base:latest

# Build your app (super fast!)
docker build -f apps/server/Dockerfile.ultra-fast -t buster-server:latest .
```


### Update Base Image (periodically):
```bash
# Rebuild and push new base
docker buildx build --platform linux/amd64,linux/arm64 \
  -f apps/server/Dockerfile.custom-base \
  -t ghcr.io/buster-so/server-base:latest \
  --push .