#!/bin/bash

# Test script for optimized Bun server Dockerfile
# This script builds and tests the server Docker image with proper environment variables
# Updated for the optimized multi-stage Dockerfile using oven/bun base image

set -e  # Exit on any error

echo "🐳 Testing Optimized Buster Server Dockerfile"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="buster-server-optimized"
CONTAINER_NAME="buster-server-optimized-container"
SERVER_PORT=3002
HOST_PORT=3002

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Check if we're in the right directory
if [[ ! -f "Dockerfile" ]]; then
    echo -e "${RED}❌ Dockerfile not found in current directory${NC}"
    echo "Please run this script from apps/server/"
    exit 1
fi

echo -e "${BLUE}📋 Build Information:${NC}"
echo "- Using optimized Bun-based multi-stage Dockerfile"
echo "- Base image: oven/bun:1.2.15-alpine (includes Node.js compatibility)"
echo "- Package manager: pnpm (installed in container)"
echo "- Build context: repository root (for workspace dependencies)"
echo ""

echo -e "${YELLOW}📦 Building Docker image...${NC}"
echo "Build context: ../../ (repository root)"
echo "Dockerfile: ./Dockerfile"

# Build from repository root to access workspace packages
docker build -t $IMAGE_NAME -f Dockerfile ../../

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker build successful${NC}"
    
    # Show image information
    echo -e "${BLUE}📊 Image Information:${NC}"
    docker images $IMAGE_NAME --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo -e "${YELLOW}🚀 Running container with environment variables...${NC}"

# Run the container with environment variables passed directly
echo "Starting container: $CONTAINER_NAME"
echo "Port mapping: $HOST_PORT:$SERVER_PORT"
docker run -d \
    --name $CONTAINER_NAME \
    -e NODE_ENV=production \
    -e SERVER_PORT=3002 \
    -e SUPABASE_URL=http://localhost:54321 \
    -e SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q \
    -e ELECTRIC_PROXY_URL=http://localhost:3003 \
    -e DATABASE_URL=http://localhost:54321 \
    -p $HOST_PORT:$SERVER_PORT \
    $IMAGE_NAME

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Container started successfully${NC}"
    
    # Show container information
    echo -e "${BLUE}📋 Container Information:${NC}"
    docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${RED}❌ Failed to start container${NC}"
    exit 1
fi

echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
echo "Giving the Bun server time to initialize..."
sleep 8

# Test the health check endpoint
echo -e "${YELLOW}🏥 Testing health check endpoint...${NC}"
for i in {1..12}; do
    echo "Attempt $i: Testing http://localhost:$HOST_PORT/healthcheck"
    
    # Test with detailed response information
    response=$(curl -s -w "HTTP_CODE:%{http_code}" http://localhost:$HOST_PORT/healthcheck 2>/dev/null)
    http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    response_body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')
    
    echo "  Response code: $http_code"
    echo "  Response body: $response_body"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        break
    else
        if [ $i -eq 12 ]; then
            echo -e "${RED}❌ Health check failed after 12 attempts${NC}"
            echo "Final response code: $http_code"
            echo "Final response body: $response_body"
            echo ""
            echo -e "${YELLOW}📋 Container logs:${NC}"
            docker logs $CONTAINER_NAME
            exit 1
        fi
        echo "  Attempt $i failed (HTTP $http_code), retrying in 3 seconds..."
        sleep 3
    fi
done

# Test additional endpoints if available
echo -e "${YELLOW}🔍 Testing additional endpoints...${NC}"
echo "Health check response:"
curl -s http://localhost:$HOST_PORT/healthcheck | jq . 2>/dev/null || curl -s http://localhost:$HOST_PORT/healthcheck

# Show container runtime information
echo ""
echo -e "${BLUE}📋 Runtime Information:${NC}"
docker exec $CONTAINER_NAME bun --version 2>/dev/null && echo "✅ Bun runtime working" || echo "❌ Bun runtime issue"
docker exec $CONTAINER_NAME node --version 2>/dev/null && echo "✅ Node.js compatibility working" || echo "❌ Node.js compatibility issue"

# Show container logs
echo ""
echo -e "${YELLOW}📋 Container logs (last 15 lines):${NC}"
docker logs $CONTAINER_NAME --tail 15

# Show container stats
echo ""
echo -e "${YELLOW}📊 Container stats:${NC}"
docker stats $CONTAINER_NAME --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}"

echo ""
echo -e "${GREEN}🎉 Docker test completed successfully!${NC}"
echo -e "${YELLOW}📝 Test Summary:${NC}"
echo "- Image: $IMAGE_NAME"
echo "- Container: $CONTAINER_NAME"
echo "- Port exposed: $HOST_PORT -> $SERVER_PORT"
echo "- Health check: ✅ PASSED"
echo "- Base image: oven/bun:1.2.15-alpine"
echo "- Runtime: Bun with Node.js compatibility"

# No cleanup needed since we're not creating temporary files

echo ""
echo -e "${YELLOW}ℹ️  Manual testing commands:${NC}"
echo "Exec into container: docker exec -it $CONTAINER_NAME /bin/sh"
echo "Test health endpoint: curl http://localhost:$HOST_PORT/healthcheck"
echo "View logs: docker logs $CONTAINER_NAME"
echo "Stop container: docker stop $CONTAINER_NAME"

# Container will be stopped and removed by the cleanup function 