# TICKET-011: Observability & Monitoring

**Priority**: 🟢 Medium  
**Estimated Effort**: 3-4 days  
**Dependencies**: TICKET-008 (Production Environment)  
**Blocks**: None

## Problem Statement

The system lacks comprehensive monitoring, metrics collection, and observability features needed for production operations. While Braintrust integration exists for LLM tracing, broader system health monitoring is missing.

## Current State

### Existing Observability:
- ✅ Braintrust integration for LLM tracing
- ✅ Basic console logging
- ✅ Basic health checks

### Missing Observability:
- ❌ Application performance metrics
- ❌ Business logic monitoring
- ❌ Error correlation and tracking
- ❌ Resource utilization monitoring
- ❌ User behavior analytics
- ❌ Alert system for critical issues

## Scope

### Files to Create:
- `src/monitoring/metrics.ts`
- `src/monitoring/tracing.ts`
- `src/monitoring/alerts.ts`
- `src/monitoring/dashboards.ts`
- `src/monitoring/error-tracking.ts`
- `src/monitoring/business-metrics.ts`

### Files to Modify:
- All step implementations (add metrics)
- All tool implementations (add tracing)
- Workflow orchestration (add monitoring)

### Changes Required:

#### 1. Create Comprehensive Metrics System
```typescript
// src/monitoring/metrics.ts
import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Summary } from 'prom-client';
import { getProductionConfig } from '../config/production';

// Enable default Node.js metrics
collectDefaultMetrics({ register });

// Workflow metrics
export const workflowMetrics = {
  executions: new Counter({
    name: 'analyst_workflow_executions_total',
    help: 'Total number of workflow executions',
    labelNames: ['status', 'user_id', 'organization_id'],
  }),

  duration: new Histogram({
    name: 'analyst_workflow_duration_seconds',
    help: 'Duration of workflow executions',
    labelNames: ['status', 'step'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
  }),

  activeExecutions: new Gauge({
    name: 'analyst_workflow_active_executions',
    help: 'Number of currently active workflow executions',
  }),

  stepExecutions: new Counter({
    name: 'analyst_workflow_step_executions_total',
    help: 'Total number of step executions',
    labelNames: ['step_name', 'status'],
  }),

  stepDuration: new Histogram({
    name: 'analyst_workflow_step_duration_seconds',
    help: 'Duration of individual step executions',
    labelNames: ['step_name'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  }),
};

// Tool metrics
export const toolMetrics = {
  executions: new Counter({
    name: 'analyst_tool_executions_total',
    help: 'Total number of tool executions',
    labelNames: ['tool_name', 'status'],
  }),

  duration: new Histogram({
    name: 'analyst_tool_duration_seconds',
    help: 'Duration of tool executions',
    labelNames: ['tool_name'],
    buckets: [0.01, 0.1, 0.5, 1, 2, 5, 10, 30],
  }),

  errors: new Counter({
    name: 'analyst_tool_errors_total',
    help: 'Total number of tool execution errors',
    labelNames: ['tool_name', 'error_type'],
  }),
};

// Database metrics
export const databaseMetrics = {
  connections: new Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections',
  }),

  queryDuration: new Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database queries',
    labelNames: ['operation'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
  }),

  queryResults: new Histogram({
    name: 'database_query_result_rows',
    help: 'Number of rows returned by database queries',
    buckets: [1, 10, 100, 1000, 5000, 10000, 50000],
  }),

  errors: new Counter({
    name: 'database_errors_total',
    help: 'Total number of database errors',
    labelNames: ['error_type'],
  }),
};

// LLM metrics
export const llmMetrics = {
  requests: new Counter({
    name: 'llm_requests_total',
    help: 'Total number of LLM requests',
    labelNames: ['model', 'agent', 'status'],
  }),

  tokens: new Histogram({
    name: 'llm_tokens_used',
    help: 'Number of tokens used in LLM requests',
    labelNames: ['model', 'type'], // type: input/output
    buckets: [100, 500, 1000, 2000, 5000, 10000, 20000],
  }),

  duration: new Histogram({
    name: 'llm_request_duration_seconds',
    help: 'Duration of LLM requests',
    labelNames: ['model', 'agent'],
    buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
  }),

  errors: new Counter({
    name: 'llm_errors_total',
    help: 'Total number of LLM errors',
    labelNames: ['model', 'error_type'],
  }),
};

// Business metrics
export const businessMetrics = {
  successfulAnalyses: new Counter({
    name: 'successful_analyses_total',
    help: 'Total number of successful data analyses',
    labelNames: ['organization_id', 'data_source_type'],
  }),

  chartsCreated: new Counter({
    name: 'charts_created_total',
    help: 'Total number of charts/visualizations created',
    labelNames: ['chart_type', 'organization_id'],
  }),

  queriesExecuted: new Counter({
    name: 'sql_queries_executed_total',
    help: 'Total number of SQL queries executed',
    labelNames: ['data_source_type', 'organization_id'],
  }),

  conversationLength: new Histogram({
    name: 'conversation_message_count',
    help: 'Number of messages in conversations',
    buckets: [1, 5, 10, 20, 50, 100, 200, 500],
  }),

  userSessions: new Counter({
    name: 'user_sessions_total',
    help: 'Total number of user sessions',
    labelNames: ['organization_id'],
  }),
};

// Resource metrics
export const resourceMetrics = {
  memoryUsage: new Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type'], // heap_used, heap_total, external, etc.
  }),

  streamingAccumulator: new Histogram({
    name: 'streaming_accumulator_size_bytes',
    help: 'Size of streaming accumulator',
    buckets: [1000, 10000, 100000, 500000, 1000000, 5000000],
  }),

  conversationHistory: new Histogram({
    name: 'conversation_history_size_bytes',
    help: 'Size of conversation history',
    buckets: [1000, 10000, 100000, 500000, 1000000, 5000000, 10000000],
  }),
};

// Utility functions for metrics
export function trackWorkflowExecution<T>(
  operation: () => Promise<T>,
  labels: { user_id?: string; organization_id?: string }
): Promise<T> {
  const startTime = Date.now();
  workflowMetrics.activeExecutions.inc();

  return operation()
    .then(result => {
      workflowMetrics.executions.labels('success', labels.user_id || 'unknown', labels.organization_id || 'unknown').inc();
      workflowMetrics.duration.labels('success', 'workflow').observe((Date.now() - startTime) / 1000);
      return result;
    })
    .catch(error => {
      workflowMetrics.executions.labels('error', labels.user_id || 'unknown', labels.organization_id || 'unknown').inc();
      workflowMetrics.duration.labels('error', 'workflow').observe((Date.now() - startTime) / 1000);
      throw error;
    })
    .finally(() => {
      workflowMetrics.activeExecutions.dec();
    });
}

export function trackStepExecution<T>(
  stepName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  return operation()
    .then(result => {
      toolMetrics.executions.labels(stepName, 'success').inc();
      workflowMetrics.stepDuration.labels(stepName).observe((Date.now() - startTime) / 1000);
      return result;
    })
    .catch(error => {
      toolMetrics.executions.labels(stepName, 'error').inc();
      workflowMetrics.stepDuration.labels(stepName).observe((Date.now() - startTime) / 1000);
      throw error;
    });
}

export function trackToolExecution<T>(
  toolName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  return operation()
    .then(result => {
      toolMetrics.executions.labels(toolName, 'success').inc();
      toolMetrics.duration.labels(toolName).observe((Date.now() - startTime) / 1000);
      return result;
    })
    .catch(error => {
      toolMetrics.executions.labels(toolName, 'error').inc();
      toolMetrics.duration.labels(toolName).observe((Date.now() - startTime) / 1000);
      
      const errorType = error instanceof Error ? error.constructor.name : 'Unknown';
      toolMetrics.errors.labels(toolName, errorType).inc();
      
      throw error;
    });
}

export function updateMemoryMetrics(): void {
  const memUsage = process.memoryUsage();
  resourceMetrics.memoryUsage.labels('heap_used').set(memUsage.heapUsed);
  resourceMetrics.memoryUsage.labels('heap_total').set(memUsage.heapTotal);
  resourceMetrics.memoryUsage.labels('external').set(memUsage.external);
  resourceMetrics.memoryUsage.labels('rss').set(memUsage.rss);
}

// Start memory monitoring
setInterval(updateMemoryMetrics, 10000); // Every 10 seconds

// Metrics endpoint for Prometheus
export function setupMetricsEndpoint(app: any): void {
  const config = getProductionConfig();
  
  if (config.monitoring.enabled) {
    app.get('/metrics', async (req: any, res: any) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (error) {
        res.status(500).end(error instanceof Error ? error.message : 'Metrics collection failed');
      }
    });
  }
}
```

#### 2. Create Error Tracking System
```typescript
// src/monitoring/error-tracking.ts
import { v4 as uuidv4 } from 'uuid';

export interface ErrorContext {
  errorId: string;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  requestId?: string;
  workflow?: string;
  step?: string;
  tool?: string;
  input?: any;
  stackTrace?: string;
  environment: string;
  version: string;
}

export interface TrackedError {
  error: Error;
  context: ErrorContext;
  fingerprint: string;
}

class ErrorTracker {
  private errors: Map<string, TrackedError[]> = new Map();
  private readonly maxErrorsPerFingerprint = 100;

  track(error: Error, context: Partial<ErrorContext> = {}): string {
    const errorId = uuidv4();
    const fingerprint = this.generateFingerprint(error);
    
    const fullContext: ErrorContext = {
      errorId,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || 'unknown',
      stackTrace: error.stack,
      ...context,
    };

    const trackedError: TrackedError = {
      error,
      context: fullContext,
      fingerprint,
    };

    // Store error by fingerprint
    if (!this.errors.has(fingerprint)) {
      this.errors.set(fingerprint, []);
    }

    const errorList = this.errors.get(fingerprint)!;
    errorList.push(trackedError);

    // Limit errors per fingerprint
    if (errorList.length > this.maxErrorsPerFingerprint) {
      errorList.shift(); // Remove oldest error
    }

    // Log structured error
    this.logError(trackedError);

    return errorId;
  }

  private generateFingerprint(error: Error): string {
    // Create fingerprint from error type and stack trace
    const errorType = error.constructor.name;
    const stackLines = error.stack?.split('\n').slice(0, 3) || [];
    const stackFingerprint = stackLines.join('|');
    
    return Buffer.from(`${errorType}:${stackFingerprint}`).toString('base64').slice(0, 16);
  }

  private logError(trackedError: TrackedError): void {
    const { error, context, fingerprint } = trackedError;
    
    console.error('Error tracked:', {
      errorId: context.errorId,
      fingerprint,
      message: error.message,
      type: error.constructor.name,
      context: {
        userId: context.userId,
        organizationId: context.organizationId,
        workflow: context.workflow,
        step: context.step,
        tool: context.tool,
        timestamp: context.timestamp.toISOString(),
      },
      stack: context.stackTrace,
    });
  }

  getErrorStats(): {
    totalErrors: number;
    uniqueFingerprints: number;
    recentErrors: number;
    topErrors: Array<{ fingerprint: string; count: number; lastSeen: Date }>;
  } {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    let totalErrors = 0;
    let recentErrors = 0;
    const fingerprintCounts: Array<{ fingerprint: string; count: number; lastSeen: Date }> = [];

    for (const [fingerprint, errors] of this.errors.entries()) {
      totalErrors += errors.length;
      
      const recentCount = errors.filter(e => now - e.context.timestamp.getTime() < oneHour).length;
      recentErrors += recentCount;
      
      const lastSeen = new Date(Math.max(...errors.map(e => e.context.timestamp.getTime())));
      
      fingerprintCounts.push({
        fingerprint,
        count: errors.length,
        lastSeen,
      });
    }

    // Sort by count descending
    fingerprintCounts.sort((a, b) => b.count - a.count);

    return {
      totalErrors,
      uniqueFingerprints: this.errors.size,
      recentErrors,
      topErrors: fingerprintCounts.slice(0, 10),
    };
  }

  getErrorsByFingerprint(fingerprint: string): TrackedError[] {
    return this.errors.get(fingerprint) || [];
  }
}

export const errorTracker = new ErrorTracker();

// Enhanced error wrapper with tracking
export function trackError<T>(
  operation: () => T,
  context: Partial<ErrorContext> = {}
): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof Error) {
      errorTracker.track(error, context);
    }
    throw error;
  }
}

export async function trackAsyncError<T>(
  operation: () => Promise<T>,
  context: Partial<ErrorContext> = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      errorTracker.track(error, context);
    }
    throw error;
  }
}
```

#### 3. Create Business Metrics Tracking
```typescript
// src/monitoring/business-metrics.ts
import { businessMetrics } from './metrics';

export interface AnalysisMetrics {
  organizationId: string;
  userId: string;
  dataSourceType: string;
  analysisType: 'sql_query' | 'chart_creation' | 'dashboard_creation';
  success: boolean;
  duration: number;
  resourcesUsed?: {
    tokensUsed?: number;
    databaseQueries?: number;
    chartCount?: number;
  };
}

export interface ChartCreationMetrics {
  chartType: string;
  organizationId: string;
  dataPoints: number;
  creationTime: number;
  success: boolean;
}

export interface QueryExecutionMetrics {
  dataSourceType: string;
  organizationId: string;
  queryComplexity: number;
  resultRows: number;
  executionTime: number;
  success: boolean;
}

export function trackAnalysisCompletion(metrics: AnalysisMetrics): void {
  if (metrics.success) {
    businessMetrics.successfulAnalyses
      .labels(metrics.organizationId, metrics.dataSourceType)
      .inc();
  }

  // Track specific analysis types
  switch (metrics.analysisType) {
    case 'sql_query':
      businessMetrics.queriesExecuted
        .labels(metrics.dataSourceType, metrics.organizationId)
        .inc();
      break;
    case 'chart_creation':
    case 'dashboard_creation':
      // Chart creation will be tracked separately in trackChartCreation
      break;
  }
}

export function trackChartCreation(metrics: ChartCreationMetrics): void {
  if (metrics.success) {
    businessMetrics.chartsCreated
      .labels(metrics.chartType, metrics.organizationId)
      .inc();
  }
}

export function trackQueryExecution(metrics: QueryExecutionMetrics): void {
  businessMetrics.queriesExecuted
    .labels(metrics.dataSourceType, metrics.organizationId)
    .inc();
}

export function trackUserSession(organizationId: string): void {
  businessMetrics.userSessions
    .labels(organizationId)
    .inc();
}

export function trackConversationLength(messageCount: number): void {
  businessMetrics.conversationLength.observe(messageCount);
}

// Business intelligence functions
export function getBusinessMetricsSummary(): {
  totalAnalyses: number;
  totalCharts: number;
  totalQueries: number;
  totalSessions: number;
  topOrganizations: string[];
  popularChartTypes: string[];
} {
  // This would typically be retrieved from a metrics store
  // For now, return placeholder data structure
  return {
    totalAnalyses: 0,
    totalCharts: 0,
    totalQueries: 0,
    totalSessions: 0,
    topOrganizations: [],
    popularChartTypes: [],
  };
}
```

#### 4. Create Alert System
```typescript
// src/monitoring/alerts.ts
import { errorTracker } from './error-tracking';
import { databaseMetrics, workflowMetrics, resourceMetrics } from './metrics';

export interface AlertRule {
  id: string;
  name: string;
  condition: () => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action?: () => void;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    // Resolve any active alerts for this rule
    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (alert.ruleId === ruleId) {
        this.resolveAlert(alertId);
      }
    }
  }

  start(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkRules();
    }, intervalMs);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private checkRules(): void {
    for (const rule of this.rules.values()) {
      try {
        const isTriggered = rule.condition();
        const existingAlert = Array.from(this.activeAlerts.values())
          .find(alert => alert.ruleId === rule.id && !alert.resolved);

        if (isTriggered && !existingAlert) {
          // Create new alert
          this.createAlert(rule);
        } else if (!isTriggered && existingAlert) {
          // Resolve existing alert
          this.resolveAlert(existingAlert.id);
        }
      } catch (error) {
        console.error(`Error checking alert rule ${rule.id}:`, error);
      }
    }
  }

  private createAlert(rule: AlertRule): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: `${rule.name}: ${rule.description}`,
      timestamp: new Date(),
      resolved: false,
    };

    this.activeAlerts.set(alert.id, alert);
    this.notifyAlert(alert);

    // Execute rule action if defined
    if (rule.action) {
      try {
        rule.action();
      } catch (error) {
        console.error(`Error executing alert action for rule ${rule.id}:`, error);
      }
    }
  }

  private resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.notifyResolution(alert);
    }
  }

  private notifyAlert(alert: Alert): void {
    console.warn(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`, {
      alertId: alert.id,
      ruleId: alert.ruleId,
      timestamp: alert.timestamp.toISOString(),
    });
  }

  private notifyResolution(alert: Alert): void {
    console.info(`✅ RESOLVED: ${alert.message}`, {
      alertId: alert.id,
      ruleId: alert.ruleId,
      resolvedAt: alert.resolvedAt?.toISOString(),
    });
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  getAlertHistory(hours: number = 24): Alert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.timestamp > cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const alertManager = new AlertManager();

// Default alert rules
export function setupDefaultAlerts(): void {
  // High error rate alert
  alertManager.addRule({
    id: 'high_error_rate',
    name: 'High Error Rate',
    severity: 'high',
    description: 'Error rate is above 10% in the last hour',
    condition: () => {
      const stats = errorTracker.getErrorStats();
      return stats.recentErrors > 10; // Simplified condition
    },
  });

  // Memory usage alert
  alertManager.addRule({
    id: 'high_memory_usage',
    name: 'High Memory Usage',
    severity: 'medium',
    description: 'Memory usage is above 80%',
    condition: () => {
      const memUsage = process.memoryUsage();
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      return memoryUsagePercent > 80;
    },
  });

  // Database connection alert
  alertManager.addRule({
    id: 'database_connection_issues',
    name: 'Database Connection Issues',
    severity: 'critical',
    description: 'Database connection pool is exhausted or unhealthy',
    condition: () => {
      // This would check actual database metrics
      return false; // Placeholder
    },
  });

  // Workflow failure rate alert
  alertManager.addRule({
    id: 'workflow_failure_rate',
    name: 'High Workflow Failure Rate',
    severity: 'high',
    description: 'Workflow failure rate is above 20%',
    condition: () => {
      // This would check actual workflow metrics
      return false; // Placeholder
    },
  });

  // Start monitoring
  alertManager.start();
}
```

#### 5. Update Workflow and Tools with Monitoring
```typescript
// Update workflow execution with monitoring
// In src/workflows/analyst-workflow.ts
import { trackWorkflowExecution } from '../monitoring/metrics';
import { errorTracker } from '../monitoring/error-tracking';

// Wrap workflow execution
export async function executeAnalystWorkflow(
  inputData: any,
  runtimeContext: RuntimeContext<AnalystRuntimeContext>
) {
  const userId = runtimeContext.get('userId');
  const organizationId = runtimeContext.get('organizationId');
  
  return trackWorkflowExecution(
    async () => {
      const run = analystWorkflow.createRun();
      return await run.start({ inputData, runtimeContext });
    },
    { user_id: userId, organization_id: organizationId }
  );
}

// Update step implementations with monitoring
// In src/steps/analyst-step.ts
import { trackStepExecution } from '../monitoring/metrics';
import { trackAnalysisCompletion } from '../monitoring/business-metrics';

const analystExecution = async ({ inputData, runtimeContext }) => {
  return trackStepExecution('analyst', async () => {
    try {
      // Existing step logic...
      const result = await executeStep();
      
      // Track business metrics
      trackAnalysisCompletion({
        organizationId: runtimeContext.get('organizationId'),
        userId: runtimeContext.get('userId'),
        dataSourceType: runtimeContext.get('dataSourceSyntax'),
        analysisType: 'chart_creation',
        success: true,
        duration: Date.now() - startTime,
      });
      
      return result;
    } catch (error) {
      errorTracker.track(error as Error, {
        userId: runtimeContext.get('userId'),
        organizationId: runtimeContext.get('organizationId'),
        workflow: 'analyst-workflow',
        step: 'analyst',
      });
      throw error;
    }
  });
};
```

## Acceptance Criteria

- [ ] Comprehensive metrics collection for all system components
- [ ] Error tracking with fingerprinting and correlation
- [ ] Business metrics tracking for analysis outcomes
- [ ] Alert system for critical issues
- [ ] Prometheus metrics endpoint
- [ ] Structured logging with correlation IDs
- [ ] Performance monitoring and resource tracking

## Test Plan

- [ ] Test metrics collection accuracy
- [ ] Test error tracking and fingerprinting
- [ ] Test alert rule triggering and resolution
- [ ] Test business metrics calculation
- [ ] Test monitoring endpoint performance
- [ ] Test resource usage tracking

## Integration

### Prometheus Integration:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'analyst-workflow'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### Grafana Dashboards:
- Workflow execution dashboard
- Error tracking dashboard
- Business metrics dashboard
- Resource utilization dashboard

## Configuration

Add monitoring environment variables:
```bash
# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
ALERT_CHECK_INTERVAL_MS=60000
ERROR_TRACKING_ENABLED=true
BUSINESS_METRICS_ENABLED=true
```

## Notes

This ticket depends on production environment setup (TICKET-008) for configuration management. It provides the observability foundation needed for production operations and troubleshooting.