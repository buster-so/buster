import { dbPing } from '@buster/database';
import { SERVER_KEYS, getSecret } from '@buster/secrets';
import { Hono } from 'hono';
import type { Context } from 'hono';
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      responseTime?: number;
    };
  };
}

async function checkDatabase(): Promise<{
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  responseTime?: number;
}> {
  // TODO: Implement actual database health check
  // This would typically ping the database and measure response time
  const start = Date.now();

  try {
    // Placeholder for database ping
    const pingResult = await dbPing();

    const responseTime = Date.now() - start;
    return {
      status: pingResult ? 'pass' : 'fail',
      responseTime,
      message: pingResult ? 'Database connection healthy' : 'Database connection failed',
    };
  } catch (error) {
    return { status: 'fail', message: `Database connection failed: ${error}` };
  }
}

function checkMemory(): { status: 'pass' | 'fail' | 'warn'; message?: string } {
  const memUsage = process.memoryUsage();

  // Use RSS (Resident Set Size) as the baseline - this is the actual memory allocated to the process

  // Convert values to MB for display
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

  // Use more reasonable thresholds based on actual memory usage
  if (rssMB > 512) {
    // Over 512MB
    return {
      status: 'fail',
      message: `Memory usage critical: ${rssMB}MB RSS (heap: ${heapUsedMB}MB/${heapTotalMB}MB)`,
    };
  }
  if (rssMB > 256) {
    // Over 256MB
    return {
      status: 'warn',
      message: `Memory usage high: ${rssMB}MB RSS (heap: ${heapUsedMB}MB/${heapTotalMB}MB)`,
    };
  }

  return {
    status: 'pass',
    message: `Memory usage normal: ${rssMB}MB RSS (heap: ${heapUsedMB}MB/${heapTotalMB}MB)`,
  };
}

async function performHealthCheck(): Promise<HealthCheckResult> {
  // Check required secrets are accessible
  try {
    const [databaseUrl, electricProxyUrl, supabaseUrl, supabaseServiceRoleKey] = await Promise.all([
      getSecret(SERVER_KEYS.DATABASE_URL),
      getSecret(SERVER_KEYS.ELECTRIC_PROXY_URL),
      getSecret(SERVER_KEYS.SUPABASE_URL),
      getSecret(SERVER_KEYS.SUPABASE_SERVICE_ROLE_KEY),
    ]);

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    if (!electricProxyUrl) {
      throw new Error('ELECTRIC_PROXY_URL is not set');
    }

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not set');
    }

    if (!supabaseServiceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }
  } catch (error) {
    throw new Error(
      `Failed to retrieve required secrets: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  const [dbCheck] = await Promise.all([checkDatabase()]);

  const memoryCheck = checkMemory();

  const checks = {
    database: dbCheck,
    memory: memoryCheck,
  };

  // Determine overall status
  const hasFailures = Object.values(checks).some((check) => check.status === 'fail');
  const hasWarnings = Object.values(checks).some((check) => check.status === 'warn');

  let status: 'healthy' | 'unhealthy' | 'degraded';
  if (hasFailures) {
    status = 'unhealthy';
  } else if (hasWarnings) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
  };
}

async function healthCheckHandler(c: Context) {
  try {
    const healthResult = await performHealthCheck();

    // Return appropriate HTTP status
    const statusCode =
      healthResult.status === 'healthy' ? 200 : healthResult.status === 'degraded' ? 200 : 503;

    return c.json(healthResult, statusCode);
  } catch (error) {
    return c.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      503
    );
  }
}

// Simple CORS test endpoint
async function corsTestHandler(c: Context) {
  return c.json({
    message: 'CORS is working!',
    origin: c.req.header('origin'),
    method: c.req.method,
    timestamp: new Date().toISOString(),
    userAgent: c.req.header('user-agent'),
    authorization: c.req.header('authorization') ? 'present' : 'not present',
  });
}

// Create healthcheck routes
const app = new Hono().get('/', healthCheckHandler).get('/cors-test', corsTestHandler);

export default app;
