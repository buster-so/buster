#!/bin/bash

set -e

echo "🚀 Starting services in background..."

# Start turbo in background and capture PID
pnpm turbo start > turbo.log 2>&1 &
TURBO_PID=$!
echo $TURBO_PID > turbo.pid
echo "Started turbo with PID $TURBO_PID"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Cleaning up..."
    if [ -f turbo.pid ]; then
        kill $(cat turbo.pid) 2>/dev/null || true
        rm turbo.pid
    fi
}
trap cleanup EXIT

# Function to check if a service is ready
check_service() {
    local port=$1
    local service_name=$2
    local max_attempts=60
    local attempt=0

    echo "🔍 Checking $service_name on port $port..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s --connect-timeout 2 --max-time 5 http://localhost:$port > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        
        echo "  Waiting for $service_name (attempt $((attempt+1))/$max_attempts)..."
        sleep 3
        attempt=$((attempt+1))
    done
    
    echo "❌ $service_name failed to start on port $port"
    return 1
}

# Function to check database
check_database() {
    local max_attempts=40
    local attempt=0
    
    echo "🔍 Checking database connectivity..."
    
    while [ $attempt -lt $max_attempts ]; do
        if pg_isready -h localhost -p 54322 -U postgres > /dev/null 2>&1; then
            echo "✅ Database is ready!"
            return 0
        fi
        
        echo "  Waiting for database (attempt $((attempt+1))/$max_attempts)..."
        sleep 2
        attempt=$((attempt+1))
    done
    
    echo "❌ Database failed to start"
    return 1
}

# Wait for services to start
echo "⏳ Waiting for services to be ready..."

# Check database first (foundational service)
if ! check_database; then
    echo "💥 Database startup failed"
    exit 1
fi

# Check other services in dependency order
# Note: Adjust ports based on your actual service ports
services=(
    "3003:Electric"
    "3002:Server" 
    "3001:API"
    "3000:Web"
)

failed_services=()
for service in "${services[@]}"; do
    port=$(echo $service | cut -d: -f1)
    name=$(echo $service | cut -d: -f2)
    
    if ! check_service $port "$name"; then
        failed_services+=("$name")
    fi
done

# Report results
if [ ${#failed_services[@]} -eq 0 ]; then
    echo "🎉 All services are ready!"
    echo "Services started successfully. You can now run additional commands."
    
    # Show current status
    echo "📊 Service Status:"
    echo "  Database: ✅ (port 54322)"
    for service in "${services[@]}"; do
        port=$(echo $service | cut -d: -f1)
        name=$(echo $service | cut -d: -f2)
        echo "  $name: ✅ (port $port)"
    done
    
    # Keep running (don't exit)
    echo "🔄 Services running in background. Press Ctrl+C to stop."
    wait $TURBO_PID
else
    echo "💥 Some services failed to start: ${failed_services[*]}"
    echo "=== Turbo logs ==="
    tail -50 turbo.log || true
    exit 1
fi
