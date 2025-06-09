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
    // await db.ping();
    const responseTime = Date.now() - start;
    return {
      status: 'pass',
      responseTime,
      message: 'Database connection healthy'
    };
  } catch (error) {
    return { status: 'fail', message: 'Database connection failed' };
  }
}

function checkMemory(): { status: 'pass' | 'fail' | 'warn'; message?: string } {
  const memUsage = process.memoryUsage();
  
  // Calculate percentage using raw bytes for accuracy
  const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  // Round values for display only
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

  if (usagePercent > 90) {
    return {
      status: 'fail',
      message: `Memory usage critical: ${heapUsedMB}MB/${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`
    };
  } else if (usagePercent > 80) {
    return {
      status: 'warn',
      message: `Memory usage high: ${heapUsedMB}MB/${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`
    };
  }

  return {
    status: 'pass',
    message: `Memory usage normal: ${heapUsedMB}MB/${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`
  };
}

async function performHealthCheck(): Promise<HealthCheckResult> {
  const [dbCheck] = await Promise.all([checkDatabase()]);

  const memoryCheck = checkMemory();

  const checks = {
    database: dbCheck,
    memory: memoryCheck
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
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks
  };
}

async function healthCheckHandler(c: Context) {
  try {
    const healthResult = await performHealthCheck();

    // Return appropriate HTTP status
    const statusCode = healthResult.status === 'healthy' ? 200 : healthResult.status === 'degraded' ? 200 : 503;

    return c.json(healthResult, statusCode);
  } catch (error) {
    return c.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      503
    );
  }
}

// Create healthcheck routes
const healthcheckRoutes = new Hono();

// GET /healthcheck - Comprehensive health check
healthcheckRoutes.get('/', healthCheckHandler);

export default healthcheckRoutes;
