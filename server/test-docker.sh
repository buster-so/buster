#!/bin/bash

# Test script for server Dockerfile
# This script builds and tests the server Docker image with proper environment variables

set -e  # Exit on any error

echo "🐳 Testing Buster Server Dockerfile"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="buster-server-test"
CONTAINER_NAME="buster-server-test-container"
SERVER_PORT=3002
HOST_PORT=3002  # Use different host port to avoid conflicts

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t $IMAGE_NAME -f Dockerfile ..

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker build successful${NC}"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo -e "${YELLOW}🚀 Running container with environment variables...${NC}"

# Create a temporary .env file for testing
cat > .env.docker.test << EOF
# Test environment variables for Docker
NODE_ENV=production
SERVER_PORT=3002
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
ELECTRIC_URL=http://localhost:3003
DATABASE_URL=http://localhost:54321
EOF

# Run the container with environment variables
docker run -d \
    --name $CONTAINER_NAME \
    --env-file .env.docker.test \
    -p $SERVER_PORT:$SERVER_PORT \
    $IMAGE_NAME

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Container started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start container${NC}"
    exit 1
fi

echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
sleep 5

# Test the health check endpoint
echo -e "${YELLOW}🏥 Testing health check endpoint at http://localhost:$HOST_PORT/healthcheck ${NC}"
for i in {1..10}; do
    echo "Attempt $i: Testing http://localhost:$SERVER_PORT/healthcheck"
    
    # First, test without -f flag to see the actual response
    response=$(curl -s -w "HTTP_CODE:%{http_code}" http://localhost:$SERVER_PORT/healthcheck)
    http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    response_body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')
    
    echo "Response code: $http_code"
    echo "Response body: $response_body"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        break
    else
        if [ $i -eq 10 ]; then
            echo -e "${RED}❌ Health check failed after 10 attempts${NC}"
            echo "Final response code: $http_code"
            echo "Final response body: $response_body"
            echo "Container logs:"
            docker logs $CONTAINER_NAME
            exit 1
        fi
        echo "Attempt $i failed (HTTP $http_code), retrying in 2 seconds..."
        sleep 2
    fi
done

# Test a specific API endpoint
echo -e "${YELLOW}🔍 Testing API endpoint...${NC}"
response=$(curl -s http://localhost:$SERVER_PORT/healthcheck)
echo "Health check response: $response"

# Show container logs
echo -e "${YELLOW}📋 Container logs:${NC}"
docker logs $CONTAINER_NAME --tail 20

# Show container stats
echo -e "${YELLOW}📊 Container stats:${NC}"
docker stats $CONTAINER_NAME --no-stream

echo -e "${GREEN}🎉 Docker test completed successfully!${NC}"
echo -e "${YELLOW}📝 Test Summary:${NC}"
echo "- Image built: $IMAGE_NAME"
echo "- Container running: $CONTAINER_NAME"
echo "- Port exposed: $SERVER_PORT"
echo "- Health check: PASSED"

# Clean up the test env file
rm -f .env.docker.test

echo -e "${YELLOW}ℹ️  To manually test further:${NC}"
echo "docker exec -it $CONTAINER_NAME /bin/sh"
echo "curl http://localhost:$SERVER_PORT/healthcheck"

# Container will be stopped and removed by the cleanup function 