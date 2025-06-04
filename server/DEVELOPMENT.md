# Server Development Guide

This guide explains how to work with and extend the Buster API server.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Server will be available at http://localhost:3002
```

## Project Structure

```
src/
├── index.ts              # Main Hono app entry point
├── api/                  # API route handlers
│   └── v2/              # API version 2 (current)
│       ├── index.ts     # V2 route mounting
│       ├── user/        # User-related routes
│       └── datasets/    # Dataset-related routes (to be created)
├── middleware/          # Custom middleware
│   ├── cors.ts         # CORS configuration
│   └── logger.ts       # Request logging
└── utils/              # Utility functions
    ├── response.ts     # Response helpers
    └── healthcheck.ts  # Health check utilities
```

## Health Check Endpoints

The server provides both basic and comprehensive health check endpoints:

### Basic Health Check
- **Endpoint**: `GET /`
- **Purpose**: Simple status check for basic uptime monitoring
- **Response**:
```json
{
  "status": "ok",
  "message": "Buster API Server is running",
  "version": "1.0.0"
}
```

### Comprehensive Health Check
- **Endpoints**: `GET /health` or `GET /healthcheck`
- **Purpose**: Detailed system health including dependencies
- **Response** (when healthy):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development",
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database connection healthy",
      "responseTime": 12
    },
    "redis": {
      "status": "pass", 
      "message": "Redis connection healthy",
      "responseTime": 3
    },
    "memory": {
      "status": "pass",
      "message": "Memory usage normal: 45MB/128MB (35.2%)"
    }
  }
}
```

### Health Check Status Codes
- **200**: System is healthy or degraded (with warnings)
- **503**: System is unhealthy (critical failures detected)

### Health Check Statuses
- **healthy**: All checks passed
- **degraded**: Some warnings detected (high memory usage, slow responses)
- **unhealthy**: Critical failures detected (database down, etc.)

### Extending Health Checks

To add new health checks, edit `src/utils/healthcheck.ts`:

```typescript
// Add your check function
async function checkYourService(): Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string; responseTime?: number }> {
  try {
    // Your check logic here
    return { status: 'pass', message: 'Service is healthy' };
  } catch (error) {
    return { status: 'fail', message: 'Service check failed' };
  }
}

// Add to the performHealthCheck function
const checks = {
  database: dbCheck,
  redis: redisCheck,
  memory: memoryCheck,
  yourService: await checkYourService(), // Add your check here
};
```

## Adding New Routes

### 1. Create Feature Directory

```bash
mkdir src/api/v2/your-feature
```

### 2. Create Route Handler

Create `src/api/v2/your-feature/index.ts`:

```typescript
import { Hono } from 'hono';
import { successResponse, errorResponse } from '../../../utils/response';

const app = new Hono();

app.get('/', (c) => {
  return successResponse(c, [], 'Your feature data');
});

app.post('/', async (c) => {
  try {
    const data = await c.req.json();
    // Your business logic here
    return successResponse(c, data, 'Created successfully');
  } catch (error) {
    return errorResponse(c, 'Invalid data', 422);
  }
});

export default app;
```

### 3. Mount to V2 Routes

Update `src/api/v2/index.ts`:

```typescript
import yourFeatureRoutes from './your-feature';

// Add to existing routes
app.route('/your-feature', yourFeatureRoutes);
```

### 4. Update API Documentation

Add your endpoint to the main route list in `src/api/v2/index.ts`.

## Available Utilities

### Response Helpers

```typescript
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse } from '../../../utils/response';

// Success response
return successResponse(c, data, 'Operation successful');

// Error responses
return errorResponse(c, 'Something went wrong', 400);
return notFoundResponse(c, 'User');
return unauthorizedResponse(c, 'Invalid token');
```

### Middleware

The server includes:
- **CORS**: Cross-origin request handling
- **Logger**: Request/response logging
- **Error Handler**: Global error handling
- **404 Handler**: Not found responses

## Business Logic Integration

As mentioned in the README, API routes should consume business logic from packages:

```typescript
// Import from packages
import { getUserById, createUser } from '@/packages/users';

app.get('/:id', async (c) => {
  const userId = c.req.param('id');
  
  try {
    // Use package business logic
    const user = await getUserById(userId);
    return successResponse(c, user);
  } catch (error) {
    return errorResponse(c, 'User not found', 404);
  }
});
```

## Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test --filter "user"

# Run with watch mode
bun test --watch
```

## Environment Variables

Create a `.env` file:

```bash
PORT=3002
NODE_ENV=development
# Add other environment variables as needed
```

## API Endpoints

The server provides the following endpoints:

### Health & Status
- `GET /` - Basic health check
- `GET /health` - Comprehensive health check
- `GET /healthcheck` - Alternative comprehensive health check

### API v2
- `GET /api/v2` - API v2 information
- `GET /api/v2/user` - List users
- `GET /api/v2/user/:id` - Get specific user
- `POST /api/v2/user` - Create user
- `PUT /api/v2/user/:id` - Update user
- `DELETE /api/v2/user/:id` - Delete user

## Monitoring & Observability

The health check endpoints are designed for:
- **Load Balancer Health Checks**: Use `/health` for detailed dependency checks
- **Uptime Monitoring**: Use `/` for simple uptime checks
- **Application Performance Monitoring**: The detailed health check provides metrics on response times and resource usage

## Next Steps

1. Create additional feature routes in `src/api/v2/`
2. Add business logic packages in `@/packages/`
3. Implement authentication middleware
4. Add request validation
5. Set up database connections
6. Add comprehensive error handling
7. Connect real health checks to actual services 