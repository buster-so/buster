# TICKET-008: Production Environment Readiness

**Priority**: 🟡 High  
**Estimated Effort**: 3-4 days  
**Dependencies**: TICKET-004 (Error Handling), TICKET-005 (Resource Limits)  
**Blocks**: TICKET-011, TICKET-012

## Problem Statement

The application lacks production-ready environment configuration, health checks, monitoring, and deployment safety mechanisms needed for reliable production operation.

## Current Issues

### Missing Production Configuration:
- No environment-specific settings
- Hardcoded values throughout codebase
- No configuration validation
- Missing health check endpoints
- No graceful shutdown handling

### Security Concerns:
- No rate limiting
- Missing audit logging
- No request tracing
- Insufficient secret management validation

## Scope

### Files to Create:
- `src/config/environment.ts`
- `src/config/production.ts`
- `src/config/validation.ts`
- `src/monitoring/health-checks.ts`
- `src/monitoring/metrics.ts`
- `src/security/rate-limiting.ts`
- `src/security/audit-logger.ts`

### Files to Modify:
- All agent and tool configurations
- Database connection setup
- Model configurations
- Resource limit configurations

### Changes Required:

#### 1. Create Environment Configuration System
```typescript
// src/config/environment.ts
import { z } from 'zod';

const environmentSchema = z.object({
  // Application settings
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default(3000),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // AI/Model settings
  ANTHROPIC_API_KEY: z.string().min(1, 'Anthropic API key is required'),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-20250514'),
  MODEL_CACHE_ENABLED: z.string().transform(Boolean).default(true),
  MODEL_MAX_TOKENS: z.string().transform(Number).default(10000),
  MODEL_TEMPERATURE: z.string().transform(Number).default(0),
  MODEL_MAX_STEPS: z.string().transform(Number).default(18),
  
  // Database settings
  DATABASE_URL: z.string().url('Valid database URL is required'),
  DB_POOL_MIN: z.string().transform(Number).default(2),
  DB_POOL_MAX: z.string().transform(Number).default(10),
  DB_POOL_IDLE_TIMEOUT_MS: z.string().transform(Number).default(30000),
  DB_QUERY_TIMEOUT_MS: z.string().transform(Number).default(30000),
  
  // Resource limits
  MAX_QUERY_RESULT_ROWS: z.string().transform(Number).default(10000),
  MAX_QUERY_RESULT_SIZE_MB: z.string().transform(Number).default(50),
  MAX_STREAMING_ACCUMULATOR_SIZE: z.string().transform(Number).default(1000000),
  MAX_STREAMING_DURATION_MS: z.string().transform(Number).default(300000),
  MAX_CONVERSATION_HISTORY_MESSAGES: z.string().transform(Number).default(1000),
  MAX_CONVERSATION_HISTORY_SIZE_MB: z.string().transform(Number).default(10),
  
  // Monitoring settings
  BRAINTRUST_KEY: z.string().optional(),
  ENABLE_METRICS: z.string().transform(Boolean).default(true),
  METRICS_PORT: z.string().transform(Number).default(9090),
  HEALTH_CHECK_ENABLED: z.string().transform(Boolean).default(true),
  
  // Security settings
  RATE_LIMIT_REQUESTS_PER_MINUTE: z.string().transform(Number).default(60),
  RATE_LIMIT_BURST_SIZE: z.string().transform(Number).default(10),
  AUDIT_LOG_ENABLED: z.string().transform(Boolean).default(true),
  REQUEST_TRACING_ENABLED: z.string().transform(Boolean).default(false),
  
  // Feature flags
  FEATURE_CONVERSATION_HISTORY: z.string().transform(Boolean).default(true),
  FEATURE_STREAMING_UPDATES: z.string().transform(Boolean).default(true),
  FEATURE_QUERY_VALIDATION: z.string().transform(Boolean).default(true),
  FEATURE_PERFORMANCE_MONITORING: z.string().transform(Boolean).default(false),
});

export type Environment = z.infer<typeof environmentSchema>;

let cachedEnv: Environment | null = null;

export function getEnvironment(): Environment {
  if (cachedEnv) {
    return cachedEnv;
  }

  try {
    cachedEnv = environmentSchema.parse(process.env);
    return cachedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:', error.errors);
      throw new Error(`Environment configuration is invalid: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

export function validateEnvironment(): void {
  getEnvironment(); // This will throw if validation fails
  console.log('✅ Environment configuration validated successfully');
}

export function isProduction(): boolean {
  return getEnvironment().NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return getEnvironment().NODE_ENV === 'development';
}
```

#### 2. Create Production Configuration
```typescript
// src/config/production.ts
import { getEnvironment, isProduction } from './environment';

export function getProductionConfig() {
  const env = getEnvironment();
  
  return {
    // Logging configuration
    logging: {
      level: isProduction() ? 'warn' : 'debug',
      structured: isProduction(),
      includeStackTrace: !isProduction(),
    },
    
    // Model configuration
    model: {
      apiKey: env.ANTHROPIC_API_KEY,
      modelName: env.ANTHROPIC_MODEL,
      cacheEnabled: env.MODEL_CACHE_ENABLED,
      maxTokens: env.MODEL_MAX_TOKENS,
      temperature: env.MODEL_TEMPERATURE,
      maxSteps: env.MODEL_MAX_STEPS,
    },
    
    // Database configuration
    database: {
      url: env.DATABASE_URL,
      pool: {
        min: env.DB_POOL_MIN,
        max: env.DB_POOL_MAX,
        idleTimeoutMs: env.DB_POOL_IDLE_TIMEOUT_MS,
      },
      queryTimeoutMs: env.DB_QUERY_TIMEOUT_MS,
    },
    
    // Resource limits
    limits: {
      queryResultRows: env.MAX_QUERY_RESULT_ROWS,
      queryResultSizeMB: env.MAX_QUERY_RESULT_SIZE_MB,
      streamingAccumulatorSize: env.MAX_STREAMING_ACCUMULATOR_SIZE,
      streamingDurationMs: env.MAX_STREAMING_DURATION_MS,
      conversationHistoryMessages: env.MAX_CONVERSATION_HISTORY_MESSAGES,
      conversationHistorySizeMB: env.MAX_CONVERSATION_HISTORY_SIZE_MB,
    },
    
    // Security configuration
    security: {
      rateLimitRequestsPerMinute: env.RATE_LIMIT_REQUESTS_PER_MINUTE,
      rateLimitBurstSize: env.RATE_LIMIT_BURST_SIZE,
      auditLogEnabled: env.AUDIT_LOG_ENABLED,
      requestTracingEnabled: env.REQUEST_TRACING_ENABLED,
    },
    
    // Feature flags
    features: {
      conversationHistory: env.FEATURE_CONVERSATION_HISTORY,
      streamingUpdates: env.FEATURE_STREAMING_UPDATES,
      queryValidation: env.FEATURE_QUERY_VALIDATION,
      performanceMonitoring: env.FEATURE_PERFORMANCE_MONITORING,
    },
    
    // Monitoring configuration
    monitoring: {
      enabled: env.ENABLE_METRICS,
      port: env.METRICS_PORT,
      healthCheckEnabled: env.HEALTH_CHECK_ENABLED,
      braintrustKey: env.BRAINTRUST_KEY,
    },
  };
}
```

#### 3. Create Health Check System
```typescript
// src/monitoring/health-checks.ts
import type { Response } from 'express';
import { getDb } from '@buster/database';
import { getEnvironment } from '../config/environment';
import { connectionMonitor } from '../utils/database/connection-pool-monitor';

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  duration: number;
  details?: any;
  error?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: HealthCheckResult[];
  uptime: number;
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    const db = getDb();
    await db.execute('SELECT 1 as health_check');
    
    const connectionStats = connectionMonitor.getMetrics();
    const connectionHealth = connectionMonitor.getHealthStatus();
    
    return {
      name: 'database',
      status: connectionHealth,
      duration: Date.now() - start,
      details: {
        connectionPool: connectionStats,
        responseTime: Date.now() - start,
      }
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

async function checkAnthropicAPI(): Promise<HealthCheckResult> {
  const start = Date.now();
  const env = getEnvironment();
  
  try {
    // Simple API validation (don't make actual calls in health check)
    if (!env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY.length < 10) {
      throw new Error('Invalid Anthropic API key configuration');
    }
    
    return {
      name: 'anthropic_api',
      status: 'healthy',
      duration: Date.now() - start,
      details: {
        keyConfigured: true,
        model: env.ANTHROPIC_MODEL,
      }
    };
  } catch (error) {
    return {
      name: 'anthropic_api',
      status: 'unhealthy',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown API error'
    };
  }
}

async function checkMemoryUsage(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };
    
    // Consider unhealthy if heap usage > 90% of heap total
    const heapUsagePercent = (memUsageMB.heapUsed / memUsageMB.heapTotal) * 100;
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (heapUsagePercent > 90) status = 'unhealthy';
    else if (heapUsagePercent > 80) status = 'degraded';
    
    return {
      name: 'memory',
      status,
      duration: Date.now() - start,
      details: {
        ...memUsageMB,
        heapUsagePercent: Math.round(heapUsagePercent),
      }
    };
  } catch (error) {
    return {
      name: 'memory',
      status: 'unhealthy',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown memory error'
    };
  }
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const env = getEnvironment();
  const startTime = Date.now();
  
  // Run all health checks in parallel
  const [dbCheck, apiCheck, memoryCheck] = await Promise.all([
    checkDatabase(),
    checkAnthropicAPI(),
    checkMemoryUsage(),
  ]);
  
  const checks = [dbCheck, apiCheck, memoryCheck];
  
  // Determine overall system status
  const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
  const hasDegraded = checks.some(check => check.status === 'degraded');
  
  let systemStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (hasUnhealthy) systemStatus = 'unhealthy';
  else if (hasDegraded) systemStatus = 'degraded';
  
  return {
    status: systemStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    environment: env.NODE_ENV,
    checks,
    uptime: process.uptime(),
  };
}

export function setupHealthCheckEndpoints(app: any): void {
  // Detailed health check
  app.get('/health', async (req: any, res: Response) => {
    try {
      const health = await getSystemHealth();
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed'
      });
    }
  });
  
  // Simple liveness check
  app.get('/health/live', (req: any, res: Response) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
  
  // Readiness check
  app.get('/health/ready', async (req: any, res: Response) => {
    try {
      const dbCheck = await checkDatabase();
      const apiCheck = await checkAnthropicAPI();
      
      const ready = dbCheck.status !== 'unhealthy' && apiCheck.status !== 'unhealthy';
      
      res.status(ready ? 200 : 503).json({
        status: ready ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks: [dbCheck, apiCheck],
      });
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Readiness check failed'
      });
    }
  });
}
```

#### 4. Create Rate Limiting
```typescript
// src/security/rate-limiting.ts
import { getProductionConfig } from '../config/production';

interface RateLimitState {
  requests: number[];
  lastReset: number;
}

const userLimits = new Map<string, RateLimitState>();

export class RateLimitExceededError extends Error {
  constructor(
    public readonly userId: string,
    public readonly limit: number,
    public readonly resetTime: number
  ) {
    super(`Rate limit exceeded for user ${userId}. Limit: ${limit} requests per minute. Reset at: ${new Date(resetTime).toISOString()}`);
    this.name = 'RateLimitExceededError';
  }
}

export function checkRateLimit(userId: string): void {
  const config = getProductionConfig();
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  let userState = userLimits.get(userId);
  
  if (!userState) {
    userState = { requests: [], lastReset: now };
    userLimits.set(userId, userState);
  }
  
  // Remove expired requests
  userState.requests = userState.requests.filter(
    timestamp => now - timestamp < windowMs
  );
  
  // Check if limit exceeded
  if (userState.requests.length >= config.security.rateLimitRequestsPerMinute) {
    const oldestRequest = Math.min(...userState.requests);
    const resetTime = oldestRequest + windowMs;
    
    throw new RateLimitExceededError(
      userId,
      config.security.rateLimitRequestsPerMinute,
      resetTime
    );
  }
  
  // Add current request
  userState.requests.push(now);
  userState.lastReset = now;
}

export function getRateLimitInfo(userId: string): {
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const config = getProductionConfig();
  const now = Date.now();
  const windowMs = 60000;
  
  const userState = userLimits.get(userId);
  if (!userState) {
    return {
      remaining: config.security.rateLimitRequestsPerMinute,
      resetTime: now + windowMs,
      limit: config.security.rateLimitRequestsPerMinute,
    };
  }
  
  // Remove expired requests
  userState.requests = userState.requests.filter(
    timestamp => now - timestamp < windowMs
  );
  
  const remaining = Math.max(0, config.security.rateLimitRequestsPerMinute - userState.requests.length);
  const oldestRequest = userState.requests.length > 0 ? Math.min(...userState.requests) : now;
  const resetTime = oldestRequest + windowMs;
  
  return {
    remaining,
    resetTime,
    limit: config.security.rateLimitRequestsPerMinute,
  };
}

// Cleanup expired rate limit data periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 60000;
  
  for (const [userId, state] of userLimits.entries()) {
    state.requests = state.requests.filter(timestamp => now - timestamp < windowMs);
    
    // Remove users with no recent requests
    if (state.requests.length === 0 && now - state.lastReset > windowMs * 2) {
      userLimits.delete(userId);
    }
  }
}, 60000); // Run every minute
```

#### 5. Update Resource Limits with Environment Configuration
```typescript
// Update src/utils/resource-limits.ts
import { getProductionConfig } from '../config/production';

export function getResourceLimits() {
  const config = getProductionConfig();
  
  return {
    MAX_QUERY_RESULT_ROWS: config.limits.queryResultRows,
    MAX_QUERY_RESULT_SIZE_MB: config.limits.queryResultSizeMB,
    MAX_QUERY_TIMEOUT_MS: config.database.queryTimeoutMs,
    MAX_STREAMING_ACCUMULATOR_SIZE: config.limits.streamingAccumulatorSize,
    MAX_STREAMING_DURATION_MS: config.limits.streamingDurationMs,
    MAX_CONVERSATION_HISTORY_MESSAGES: config.limits.conversationHistoryMessages,
    MAX_CONVERSATION_HISTORY_SIZE_MB: config.limits.conversationHistorySizeMB,
    // ... other limits
  } as const;
}
```

#### 6. Create Graceful Shutdown Handler
```typescript
// src/config/graceful-shutdown.ts
let isShuttingDown = false;
const activeRequests = new Set<string>();

export function isGracefulShutdown(): boolean {
  return isShuttingDown;
}

export function trackRequest(requestId: string): void {
  activeRequests.add(requestId);
}

export function untrackRequest(requestId: string): void {
  activeRequests.delete(requestId);
}

export function setupGracefulShutdown(server: any): void {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, starting graceful shutdown...`);
    isShuttingDown = true;
    
    // Stop accepting new connections
    server.close(() => {
      console.log('HTTP server closed');
    });
    
    // Wait for active requests to complete
    const maxWaitMs = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (activeRequests.size > 0 && Date.now() - startTime < maxWaitMs) {
      console.log(`Waiting for ${activeRequests.size} active requests to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (activeRequests.size > 0) {
      console.warn(`Forcefully terminating with ${activeRequests.size} active requests`);
    }
    
    console.log('Graceful shutdown complete');
    process.exit(0);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
```

## Acceptance Criteria

- [ ] Environment configuration is validated on startup
- [ ] All hardcoded values are replaced with environment variables
- [ ] Health check endpoints return accurate system status
- [ ] Rate limiting prevents abuse
- [ ] Graceful shutdown handles active requests
- [ ] Production logging is structured and appropriate
- [ ] Configuration is environment-specific
- [ ] Feature flags control optional functionality

## Test Plan

- [ ] Test environment validation with invalid configurations
- [ ] Test health checks for all dependency states
- [ ] Test rate limiting under load
- [ ] Test graceful shutdown behavior
- [ ] Test configuration loading in different environments
- [ ] Test feature flag toggling

## Environment Variables Documentation

Create `.env.example`:
```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn

# AI/Model
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
MODEL_CACHE_ENABLED=true
MODEL_MAX_TOKENS=10000
MODEL_TEMPERATURE=0
MODEL_MAX_STEPS=18

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT_MS=30000
DB_QUERY_TIMEOUT_MS=30000

# Resource Limits
MAX_QUERY_RESULT_ROWS=10000
MAX_QUERY_RESULT_SIZE_MB=50
MAX_STREAMING_ACCUMULATOR_SIZE=1000000
MAX_STREAMING_DURATION_MS=300000
MAX_CONVERSATION_HISTORY_MESSAGES=1000
MAX_CONVERSATION_HISTORY_SIZE_MB=10

# Monitoring
BRAINTRUST_KEY=your_braintrust_key
ENABLE_METRICS=true
METRICS_PORT=9090
HEALTH_CHECK_ENABLED=true

# Security
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_BURST_SIZE=10
AUDIT_LOG_ENABLED=true
REQUEST_TRACING_ENABLED=false

# Feature Flags
FEATURE_CONVERSATION_HISTORY=true
FEATURE_STREAMING_UPDATES=true
FEATURE_QUERY_VALIDATION=true
FEATURE_PERFORMANCE_MONITORING=false
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Health checks responding
- [ ] Database connections tested
- [ ] API keys validated
- [ ] Resource limits appropriate for environment
- [ ] Monitoring configured
- [ ] Rate limiting enabled
- [ ] Graceful shutdown tested

## Notes

This ticket requires error handling (TICKET-004) and resource limits (TICKET-005) to be complete as it builds on their infrastructure. It's essential for production deployment safety.