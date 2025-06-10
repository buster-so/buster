# TICKET-012: Security Hardening

**Priority**: 🟢 Medium  
**Estimated Effort**: 3-4 days  
**Dependencies**: TICKET-008 (Production Environment)  
**Blocks**: None

## Problem Statement

The system lacks comprehensive security measures beyond basic schema validation. Input sanitization, audit logging, request validation, and security headers are missing, creating potential security vulnerabilities.

## Current Security State

### Existing Security:
- ✅ Schema validation with Zod
- ✅ Basic rate limiting (implemented in TICKET-008)
- ✅ Environment variable validation

### Missing Security:
- ❌ Input sanitization beyond schema validation
- ❌ SQL injection pattern detection
- ❌ Audit logging for sensitive operations
- ❌ Request/response security headers
- ❌ Content Security Policy (CSP)
- ❌ Input size limits and validation
- ❌ Request correlation and tracing

## Scope

### Files to Create:
- `src/security/input-sanitization.ts`
- `src/security/sql-injection-prevention.ts`
- `src/security/audit-logger.ts`
- `src/security/security-headers.ts`
- `src/security/request-validation.ts`
- `src/security/content-security.ts`

### Files to Modify:
- All tool implementations (add input sanitization)
- Database tools (add SQL injection prevention)
- API endpoints (add security headers)
- Workflow execution (add audit logging)

### Changes Required:

#### 1. Create Input Sanitization System
```typescript
// src/security/input-sanitization.ts
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

export interface SanitizationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
  removeControlChars?: boolean;
  normalizeUnicode?: boolean;
}

export class InputSanitizationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly originalValue: any
  ) {
    super(message);
    this.name = 'InputSanitizationError';
  }
}

export function sanitizeString(
  input: string,
  options: SanitizationOptions = {}
): string {
  const {
    allowHtml = false,
    maxLength = 10000,
    trimWhitespace = true,
    removeControlChars = true,
    normalizeUnicode = true,
  } = options;

  if (typeof input !== 'string') {
    throw new InputSanitizationError('Input must be a string', 'unknown', input);
  }

  let sanitized = input;

  // Normalize unicode
  if (normalizeUnicode) {
    sanitized = sanitized.normalize('NFC');
  }

  // Remove or escape HTML
  if (!allowHtml) {
    sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
  } else {
    sanitized = DOMPurify.sanitize(sanitized);
  }

  // Remove control characters (except newlines, tabs, carriage returns)
  if (removeControlChars) {
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  // Trim whitespace
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Check length
  if (sanitized.length > maxLength) {
    throw new InputSanitizationError(
      `Input too long: ${sanitized.length} characters exceeds limit of ${maxLength}`,
      'length',
      input
    );
  }

  return sanitized;
}

export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fieldOptions: Record<keyof T, SanitizationOptions> = {}
): T {
  const sanitized = { ...obj };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      const options = fieldOptions[key] || {};
      try {
        sanitized[key] = sanitizeString(value, options);
      } catch (error) {
        if (error instanceof InputSanitizationError) {
          error.field = key;
        }
        throw error;
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, fieldOptions[key] || {});
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' 
          ? sanitizeString(item, fieldOptions[key] || {})
          : item
      );
    }
  }

  return sanitized;
}

// Common sanitization presets
export const SANITIZATION_PRESETS = {
  userPrompt: {
    maxLength: 50000,
    trimWhitespace: true,
    removeControlChars: true,
    allowHtml: false,
  },
  
  sqlQuery: {
    maxLength: 100000,
    trimWhitespace: true,
    removeControlChars: true,
    allowHtml: false,
  },
  
  fileName: {
    maxLength: 255,
    trimWhitespace: true,
    removeControlChars: true,
    allowHtml: false,
  },
  
  description: {
    maxLength: 5000,
    trimWhitespace: true,
    removeControlChars: false, // Allow newlines in descriptions
    allowHtml: false,
  },
} as const;

// Zod schema extension for sanitization
export function sanitizedString(preset?: keyof typeof SANITIZATION_PRESETS) {
  return z.string().transform((val) => {
    const options = preset ? SANITIZATION_PRESETS[preset] : {};
    return sanitizeString(val, options);
  });
}

export function validateAndSanitizeInput<T>(
  input: unknown,
  schema: z.ZodSchema<T>,
  sanitizationOptions?: Record<string, SanitizationOptions>
): T {
  // First validate with schema
  const parsed = schema.parse(input);
  
  // Then sanitize if it's an object
  if (typeof parsed === 'object' && parsed !== null && sanitizationOptions) {
    return sanitizeObject(parsed as any, sanitizationOptions);
  }
  
  return parsed;
}
```

#### 2. Create SQL Injection Prevention
```typescript
// src/security/sql-injection-prevention.ts
export interface SqlValidationResult {
  isValid: boolean;
  risk: 'low' | 'medium' | 'high';
  issues: string[];
  sanitizedQuery?: string;
}

export class SqlInjectionError extends Error {
  constructor(
    message: string,
    public readonly detectedPatterns: string[],
    public readonly originalQuery: string
  ) {
    super(message);
    this.name = 'SqlInjectionError';
  }
}

// Dangerous SQL patterns that could indicate injection attempts
const DANGEROUS_PATTERNS = [
  // Union-based injection
  /\bunion\s+all\s+select/i,
  /\bunion\s+select/i,
  
  // Comment-based injection
  /;\s*--/,
  /\/\*.*?\*\//s,
  
  // Stacked queries
  /;\s*(drop|delete|insert|update|create|alter|exec|execute)/i,
  
  // Boolean-based injection
  /\s+or\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i,
  /\s+and\s+['"]?1['"]?\s*=\s*['"]?0['"]?/i,
  
  // Time-based injection
  /waitfor\s+delay/i,
  /sleep\s*\(/i,
  /benchmark\s*\(/i,
  
  // Error-based injection
  /extractvalue\s*\(/i,
  /updatexml\s*\(/i,
  
  // System function calls
  /xp_cmdshell/i,
  /sp_executesql/i,
  /openrowset/i,
  
  // Information schema probing
  /information_schema\./i,
  /sys\./i,
  /mysql\./i,
  
  // Hex encoding attempts
  /0x[0-9a-f]+/i,
  
  // SQL functions that shouldn't be in user queries
  /\bload_file\s*\(/i,
  /\binto\s+outfile/i,
  /\binto\s+dumpfile/i,
];

// Suspicious patterns that raise the risk level
const SUSPICIOUS_PATTERNS = [
  // Multiple statements
  /;\s*select/i,
  /;\s*insert/i,
  /;\s*update/i,
  /;\s*delete/i,
  
  // Unusual operators
  /\|\|/,
  /&&/,
  
  // Function calls
  /\bchar\s*\(/i,
  /\bascii\s*\(/i,
  /\bsubstring\s*\(/i,
  /\bmid\s*\(/i,
  
  // Multiple conditions
  /(or|and)\s+.*(or|and)\s+.*(or|and)/i,
];

export function validateSqlQuery(query: string): SqlValidationResult {
  const issues: string[] = [];
  let risk: 'low' | 'medium' | 'high' = 'low';

  // Normalize query for analysis
  const normalizedQuery = query
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      issues.push(`Dangerous pattern detected: ${pattern.source}`);
      risk = 'high';
    }
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      issues.push(`Suspicious pattern detected: ${pattern.source}`);
      if (risk === 'low') risk = 'medium';
    }
  }

  // Additional checks
  const semicolonCount = (query.match(/;/g) || []).length;
  if (semicolonCount > 1) {
    issues.push('Multiple statements detected (stacked queries)');
    if (risk === 'low') risk = 'medium';
  }

  // Check for excessive length (potential buffer overflow)
  if (query.length > 100000) {
    issues.push('Query length is excessive');
    if (risk === 'low') risk = 'medium';
  }

  // Check for excessive nesting
  const parenDepth = getMaxParenthesesDepth(query);
  if (parenDepth > 20) {
    issues.push('Excessive query nesting depth');
    if (risk === 'low') risk = 'medium';
  }

  const isValid = risk !== 'high';

  return {
    isValid,
    risk,
    issues,
    sanitizedQuery: isValid ? sanitizeSqlQuery(query) : undefined,
  };
}

function getMaxParenthesesDepth(query: string): number {
  let depth = 0;
  let maxDepth = 0;

  for (const char of query) {
    if (char === '(') {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
    } else if (char === ')') {
      depth--;
    }
  }

  return maxDepth;
}

function sanitizeSqlQuery(query: string): string {
  // Basic sanitization - remove comments and normalize whitespace
  return query
    .replace(/--.*$/gm, '') // Remove line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export function preventSqlInjection(query: string): string {
  const validation = validateSqlQuery(query);
  
  if (!validation.isValid) {
    throw new SqlInjectionError(
      `SQL query rejected due to security concerns: ${validation.issues.join(', ')}`,
      validation.issues,
      query
    );
  }
  
  if (validation.risk === 'medium') {
    console.warn('SQL query has medium risk patterns:', {
      query: query.substring(0, 200) + '...',
      issues: validation.issues,
    });
  }
  
  return validation.sanitizedQuery || query;
}
```

#### 3. Create Audit Logging System
```typescript
// src/security/audit-logger.ts
import { v4 as uuidv4 } from 'uuid';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  success: boolean;
  risk: 'low' | 'medium' | 'high';
}

export type AuditAction = 
  | 'workflow_execute'
  | 'sql_query_execute'
  | 'file_create'
  | 'file_modify'
  | 'data_access'
  | 'user_login'
  | 'user_logout'
  | 'permission_change'
  | 'configuration_change'
  | 'sensitive_data_access';

class AuditLogger {
  private events: AuditEvent[] = [];
  private readonly maxEvents = 10000;

  log(
    action: AuditAction,
    resource: string,
    details: {
      userId?: string;
      organizationId?: string;
      sessionId?: string;
      success: boolean;
      risk?: 'low' | 'medium' | 'high';
      ip?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    }
  ): string {
    const eventId = uuidv4();
    
    const event: AuditEvent = {
      id: eventId,
      timestamp: new Date(),
      action,
      resource,
      userId: details.userId,
      organizationId: details.organizationId,
      sessionId: details.sessionId,
      success: details.success,
      risk: details.risk || 'low',
      ip: details.ip,
      userAgent: details.userAgent,
      details: details.metadata,
    };

    this.events.push(event);

    // Maintain size limit
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log to console with appropriate level
    this.logToConsole(event);

    // In production, this would also log to external audit system
    this.logToExternalSystem(event);

    return eventId;
  }

  private logToConsole(event: AuditEvent): void {
    const logData = {
      auditId: event.id,
      timestamp: event.timestamp.toISOString(),
      action: event.action,
      resource: event.resource,
      userId: event.userId,
      organizationId: event.organizationId,
      success: event.success,
      risk: event.risk,
    };

    if (event.risk === 'high' || !event.success) {
      console.warn('🔒 AUDIT [HIGH RISK]:', logData);
    } else if (event.risk === 'medium') {
      console.info('🔒 AUDIT [MEDIUM RISK]:', logData);
    } else {
      console.log('🔒 AUDIT:', logData);
    }
  }

  private logToExternalSystem(event: AuditEvent): void {
    // In production, send to external audit/SIEM system
    // Examples: Splunk, ELK Stack, AWS CloudTrail, etc.
  }

  getEvents(filter?: Partial<AuditEvent>): AuditEvent[] {
    if (!filter) {
      return [...this.events];
    }

    return this.events.filter(event => {
      return Object.entries(filter).every(([key, value]) => {
        return event[key as keyof AuditEvent] === value;
      });
    });
  }

  getHighRiskEvents(hours: number = 24): AuditEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.events.filter(event => 
      event.timestamp > cutoff && 
      (event.risk === 'high' || !event.success)
    );
  }

  getUserActivity(userId: string, hours: number = 24): AuditEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.events.filter(event =>
      event.userId === userId && event.timestamp > cutoff
    );
  }
}

export const auditLogger = new AuditLogger();

// Convenient audit functions
export function auditWorkflowExecution(
  userId: string,
  organizationId: string,
  workflowId: string,
  success: boolean,
  metadata?: Record<string, any>
): string {
  return auditLogger.log('workflow_execute', workflowId, {
    userId,
    organizationId,
    success,
    risk: success ? 'low' : 'medium',
    metadata,
  });
}

export function auditSqlExecution(
  userId: string,
  organizationId: string,
  query: string,
  success: boolean,
  risk: 'low' | 'medium' | 'high' = 'low'
): string {
  return auditLogger.log('sql_query_execute', 'database', {
    userId,
    organizationId,
    success,
    risk,
    metadata: {
      queryLength: query.length,
      queryPreview: query.substring(0, 100),
    },
  });
}

export function auditDataAccess(
  userId: string,
  organizationId: string,
  dataSource: string,
  success: boolean,
  recordCount?: number
): string {
  return auditLogger.log('data_access', dataSource, {
    userId,
    organizationId,
    success,
    risk: recordCount && recordCount > 10000 ? 'medium' : 'low',
    metadata: { recordCount },
  });
}

export function auditFileOperation(
  action: 'file_create' | 'file_modify',
  userId: string,
  organizationId: string,
  fileName: string,
  success: boolean
): string {
  return auditLogger.log(action, fileName, {
    userId,
    organizationId,
    success,
    risk: 'low',
  });
}
```

#### 4. Create Security Headers Middleware
```typescript
// src/security/security-headers.ts
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: boolean;
  hsts?: boolean;
  frameOptions?: boolean;
  contentTypeOptions?: boolean;
  xssProtection?: boolean;
  referrerPolicy?: boolean;
}

export function setupSecurityHeaders(app: any, config: SecurityHeadersConfig = {}): void {
  const {
    contentSecurityPolicy = true,
    hsts = true,
    frameOptions = true,
    contentTypeOptions = true,
    xssProtection = true,
    referrerPolicy = true,
  } = config;

  app.use((req: any, res: any, next: any) => {
    // Content Security Policy
    if (contentSecurityPolicy) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self'; " +
        "font-src 'self'; " +
        "object-src 'none'; " +
        "media-src 'self'; " +
        "frame-src 'none';"
      );
    }

    // HTTP Strict Transport Security
    if (hsts) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // X-Frame-Options
    if (frameOptions) {
      res.setHeader('X-Frame-Options', 'DENY');
    }

    // X-Content-Type-Options
    if (contentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection
    if (xssProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // Referrer Policy
    if (referrerPolicy) {
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Remove server information
    res.removeHeader('X-Powered-By');
    res.setHeader('Server', 'Analyst API');

    next();
  });
}

export function setupCorsHeaders(app: any, allowedOrigins: string[] = []): void {
  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  });
}
```

#### 5. Create Request Validation Middleware
```typescript
// src/security/request-validation.ts
import { sanitizeObject, SANITIZATION_PRESETS } from './input-sanitization';
import { auditLogger } from './audit-logger';

export interface RequestValidationConfig {
  maxBodySize?: number;
  maxQueryParams?: number;
  maxHeaderSize?: number;
  allowedMethods?: string[];
  rateLimitByIp?: boolean;
}

export function setupRequestValidation(app: any, config: RequestValidationConfig = {}): void {
  const {
    maxBodySize = 10 * 1024 * 1024, // 10MB
    maxQueryParams = 100,
    maxHeaderSize = 8192, // 8KB
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    rateLimitByIp = true,
  } = config;

  app.use((req: any, res: any, next: any) => {
    try {
      // Method validation
      if (!allowedMethods.includes(req.method)) {
        auditLogger.log('user_login', 'invalid_method', {
          success: false,
          risk: 'medium',
          ip: req.ip,
          metadata: { method: req.method, url: req.url },
        });
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Body size validation
      const contentLength = parseInt(req.headers['content-length'] || '0');
      if (contentLength > maxBodySize) {
        auditLogger.log('data_access', 'request_too_large', {
          success: false,
          risk: 'medium',
          ip: req.ip,
          metadata: { contentLength, maxBodySize },
        });
        return res.status(413).json({ error: 'Request entity too large' });
      }

      // Query parameter validation
      const queryParamCount = Object.keys(req.query || {}).length;
      if (queryParamCount > maxQueryParams) {
        auditLogger.log('data_access', 'too_many_params', {
          success: false,
          risk: 'medium',
          ip: req.ip,
          metadata: { queryParamCount, maxQueryParams },
        });
        return res.status(400).json({ error: 'Too many query parameters' });
      }

      // Header size validation
      const headerSize = JSON.stringify(req.headers).length;
      if (headerSize > maxHeaderSize) {
        auditLogger.log('data_access', 'headers_too_large', {
          success: false,
          risk: 'medium',
          ip: req.ip,
          metadata: { headerSize, maxHeaderSize },
        });
        return res.status(431).json({ error: 'Request headers too large' });
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = sanitizeObject(req.query, {
          // Most query params should be simple strings
          '*': SANITIZATION_PRESETS.description,
        });
      }

      next();
    } catch (error) {
      auditLogger.log('data_access', 'request_validation_error', {
        success: false,
        risk: 'high',
        ip: req.ip,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      res.status(400).json({ error: 'Invalid request format' });
    }
  });
}

// Body sanitization middleware
export function setupBodySanitization(app: any): void {
  app.use((req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
      try {
        req.body = sanitizeObject(req.body, {
          prompt: SANITIZATION_PRESETS.userPrompt,
          query: SANITIZATION_PRESETS.sqlQuery,
          title: SANITIZATION_PRESETS.fileName,
          description: SANITIZATION_PRESETS.description,
        });
      } catch (error) {
        auditLogger.log('data_access', 'body_sanitization_failed', {
          success: false,
          risk: 'high',
          ip: req.ip,
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
        
        return res.status(400).json({ error: 'Invalid request body' });
      }
    }
    next();
  });
}
```

#### 6. Update Tools with Security Measures
```typescript
// Update database tools with security
// In src/tools/database-tools/execute-sql.ts
import { preventSqlInjection } from '../../security/sql-injection-prevention';
import { auditSqlExecution } from '../../security/audit-logger';
import { sanitizeString, SANITIZATION_PRESETS } from '../../security/input-sanitization';

const executeFunction = wrapTraced(
  async (input: z.infer<typeof inputSchema>, context: any) => {
    const { dataSourceId, organizationId } = getValidatedContext(context.runtimeContext);
    const userId = context.runtimeContext.get('userId');
    
    try {
      // Sanitize input
      const sanitizedQuery = sanitizeString(input.query, SANITIZATION_PRESETS.sqlQuery);
      
      // Validate SQL for injection patterns
      const secureQuery = preventSqlInjection(sanitizedQuery);
      
      // Audit the SQL execution attempt
      const auditId = auditSqlExecution(userId, organizationId, secureQuery, true);
      
      // Execute query with security measures
      const result = await withSafeConnection(
        getDataSourceConnection({ dataSourceId, organizationId }),
        async (safeConn) => {
          const queryResult = await withTimeout(
            safeConn.execute(secureQuery),
            timeoutMs,
            'database_query'
          );

          // Audit successful data access
          auditDataAccess(userId, organizationId, dataSourceId, true, queryResult.rows.length);

          return {
            success: true,
            data: queryResult.rows,
            rowCount: queryResult.rows.length,
            auditId,
          };
        }
      );

      return result;

    } catch (error) {
      // Audit failed execution
      auditSqlExecution(userId, organizationId, input.query, false, 'high');
      
      if (error instanceof SqlInjectionError) {
        // Don't expose injection details to client
        throw new Error('Query contains invalid patterns. Please review and try again.');
      }
      
      throw error;
    }
  },
  { name: 'execute-sql' }
);
```

## Acceptance Criteria

- [ ] Input sanitization for all user inputs
- [ ] SQL injection prevention for database queries
- [ ] Comprehensive audit logging for sensitive operations
- [ ] Security headers implemented on all endpoints
- [ ] Request validation with size and format limits
- [ ] Content Security Policy properly configured
- [ ] Rate limiting by IP address
- [ ] Proper error handling without information disclosure

## Test Plan

- [ ] Test input sanitization with malicious inputs
- [ ] Test SQL injection prevention with various attack patterns
- [ ] Test audit logging for all sensitive operations
- [ ] Test security headers on all endpoints
- [ ] Test request validation with oversized requests
- [ ] Test CSP compliance with frontend applications
- [ ] Test rate limiting effectiveness

## Security Scanning

Add security scanning tools:
```bash
# Package vulnerability scanning
npm audit

# Static code analysis
npm install -g eslint-plugin-security
npm install -g semgrep

# Dependency checking
npm install -g retire
```

## Configuration

Add security environment variables:
```bash
# Security settings
SECURITY_HEADERS_ENABLED=true
INPUT_SANITIZATION_ENABLED=true
SQL_INJECTION_PREVENTION_ENABLED=true
AUDIT_LOGGING_ENABLED=true
REQUEST_VALIDATION_ENABLED=true
MAX_REQUEST_SIZE_MB=10
MAX_QUERY_PARAMS=100
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## Monitoring

Add security metrics:
```typescript
export const securityMetrics = {
  sanitizationAttempts: new Counter('input_sanitization_attempts_total'),
  sqlInjectionBlocked: new Counter('sql_injection_attempts_blocked_total'),
  auditEvents: new Counter('audit_events_total', ['action', 'risk_level']),
  requestValidationFailures: new Counter('request_validation_failures_total'),
};
```

## Notes

This ticket depends on production environment configuration (TICKET-008) for security settings. It provides defense-in-depth security measures to protect against common web application vulnerabilities.