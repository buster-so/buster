# TICKET-007: Streaming Parser Robustness

**Priority**: 🟡 High  
**Estimated Effort**: 2-3 days  
**Dependencies**: TICKET-005 (Resource Management Limits)  
**Blocks**: TICKET-010

## Problem Statement

Streaming parsers silently swallow errors, lack malformed data protection, and have performance impacts with large streams. The current implementation can cause memory issues and doesn't handle edge cases gracefully.

## Current Issues

### Silent Error Handling:
```typescript
// ❌ Errors are swallowed silently
} catch (error) {
  // Silent failure - parser continues without indication of problems
  return null;
}
```

### No Malformed Data Protection:
```typescript
// ❌ No validation of incoming chunk data
this.accumulator.rawText += chunk.text || '';
```

### Performance Impact:
- Sequential regex matching on growing text
- No chunked processing for large streams
- Memory accumulation without limits

## Scope

### Files to Modify:
- `src/utils/streaming.ts`
- `src/tools/*/parseStreamingArgs functions` (5 files)
- `src/utils/streaming-safety.ts` (new file)
- `src/steps/analyst-step.ts`
- `src/steps/think-and-prep-step.ts`

### Changes Required:

#### 1. Create Streaming Safety Utilities
```typescript
// src/utils/streaming-safety.ts
import { RESOURCE_LIMITS, ResourceLimitExceededError } from './resource-limits';

export interface StreamingChunk {
  type: string;
  text?: string;
  toolName?: string;
  toolCallId?: string;
  [key: string]: any;
}

export interface SafeStreamingAccumulator {
  rawText: string;
  startTime: number;
  chunkCount: number;
  errorCount: number;
  lastError?: string;
}

export class StreamingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'StreamingError';
  }
}

export function validateStreamingChunk(chunk: unknown): StreamingChunk {
  if (!chunk || typeof chunk !== 'object') {
    throw new StreamingError(
      'Invalid chunk format: must be an object',
      'INVALID_CHUNK_FORMAT'
    );
  }

  const typedChunk = chunk as Record<string, any>;
  
  if (!typedChunk.type || typeof typedChunk.type !== 'string') {
    throw new StreamingError(
      'Invalid chunk format: missing or invalid type field',
      'MISSING_CHUNK_TYPE'
    );
  }

  // Validate text field if present
  if (typedChunk.text !== undefined && typeof typedChunk.text !== 'string') {
    throw new StreamingError(
      'Invalid chunk format: text field must be string',
      'INVALID_TEXT_FIELD'
    );
  }

  return typedChunk as StreamingChunk;
}

export function createSafeAccumulator(): SafeStreamingAccumulator {
  return {
    rawText: '',
    startTime: Date.now(),
    chunkCount: 0,
    errorCount: 0
  };
}

export function updateAccumulator(
  accumulator: SafeStreamingAccumulator,
  chunk: StreamingChunk
): SafeStreamingAccumulator {
  // Validate resource limits
  const currentTime = Date.now();
  const duration = currentTime - accumulator.startTime;
  
  if (duration > RESOURCE_LIMITS.MAX_STREAMING_DURATION_MS) {
    throw new ResourceLimitExceededError(
      'streaming_duration',
      RESOURCE_LIMITS.MAX_STREAMING_DURATION_MS,
      duration,
      'ms'
    );
  }

  const newText = chunk.text || '';
  const newTotalLength = accumulator.rawText.length + newText.length;
  
  if (newTotalLength > RESOURCE_LIMITS.MAX_STREAMING_ACCUMULATOR_SIZE) {
    throw new ResourceLimitExceededError(
      'streaming_accumulator_size',
      RESOURCE_LIMITS.MAX_STREAMING_ACCUMULATOR_SIZE,
      newTotalLength,
      ' characters'
    );
  }

  return {
    ...accumulator,
    rawText: accumulator.rawText + newText,
    chunkCount: accumulator.chunkCount + 1
  };
}

export function handleStreamingError(
  accumulator: SafeStreamingAccumulator,
  error: unknown,
  toolName: string
): SafeStreamingAccumulator {
  const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
  
  console.warn(`Streaming error in ${toolName}:`, {
    error: errorMessage,
    chunkCount: accumulator.chunkCount,
    accumulatorSize: accumulator.rawText.length,
    duration: Date.now() - accumulator.startTime
  });

  return {
    ...accumulator,
    errorCount: accumulator.errorCount + 1,
    lastError: errorMessage
  };
}

export function isStreamingHealthy(accumulator: SafeStreamingAccumulator): boolean {
  const errorRate = accumulator.errorCount / Math.max(accumulator.chunkCount, 1);
  return errorRate < 0.1; // Less than 10% error rate
}
```

#### 2. Create Robust Streaming Parser Base
```typescript
// Update src/utils/streaming.ts
import { 
  validateStreamingChunk, 
  createSafeAccumulator, 
  updateAccumulator,
  handleStreamingError,
  isStreamingHealthy,
  type SafeStreamingAccumulator,
  type StreamingChunk
} from './streaming-safety';

export interface StreamingResult {
  toolName: string;
  partialArgs: Record<string, any>;
  isComplete: boolean;
  confidence: number;
}

export class RobustToolArgsParser {
  private accumulator: SafeStreamingAccumulator;
  private parsers: Map<string, (text: string) => Record<string, any> | null>;

  constructor() {
    this.accumulator = createSafeAccumulator();
    this.parsers = new Map();
  }

  registerParser(
    toolName: string, 
    parser: (text: string) => Record<string, any> | null
  ): void {
    this.parsers.set(toolName, parser);
  }

  processChunk(chunk: unknown): StreamingResult | null {
    try {
      // Validate chunk format
      const validChunk = validateStreamingChunk(chunk);
      
      // Only process relevant chunk types
      if (!['tool-call-streaming-start', 'tool-call-delta'].includes(validChunk.type)) {
        return null;
      }

      // Update accumulator safely
      this.accumulator = updateAccumulator(this.accumulator, validChunk);

      // Check streaming health
      if (!isStreamingHealthy(this.accumulator)) {
        console.warn('Streaming health degraded, resetting parser');
        this.reset();
        return null;
      }

      // Extract tool name from chunk
      const toolName = validChunk.toolName;
      if (!toolName || !this.parsers.has(toolName)) {
        return null;
      }

      // Parse accumulated text
      const parser = this.parsers.get(toolName)!;
      const parsedArgs = this.safeParseWithFallback(parser, toolName);

      if (!parsedArgs) {
        return null;
      }

      return {
        toolName,
        partialArgs: parsedArgs,
        isComplete: this.isParsingComplete(parsedArgs),
        confidence: this.calculateConfidence(parsedArgs, this.accumulator.rawText)
      };

    } catch (error) {
      this.accumulator = handleStreamingError(
        this.accumulator, 
        error, 
        'chunk-processing'
      );
      return null;
    }
  }

  private safeParseWithFallback(
    parser: (text: string) => Record<string, any> | null,
    toolName: string
  ): Record<string, any> | null {
    try {
      return parser(this.accumulator.rawText);
    } catch (error) {
      this.accumulator = handleStreamingError(this.accumulator, error, toolName);
      
      // Try parsing with trimmed text as fallback
      try {
        const trimmedText = this.accumulator.rawText.slice(-1000); // Last 1000 chars
        return parser(trimmedText);
      } catch (fallbackError) {
        return null;
      }
    }
  }

  private isParsingComplete(args: Record<string, any>): boolean {
    // Check if args contain complete, non-empty values
    const hasCompleteValues = Object.values(args).some(value => {
      if (typeof value === 'string') {
        return value.trim().length > 0 && !value.includes('...') && !value.endsWith(',');
      }
      return value !== null && value !== undefined;
    });

    return hasCompleteValues;
  }

  private calculateConfidence(args: Record<string, any>, rawText: string): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence for complete-looking values
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string' && value.length > 0) {
        if (value.includes('{') && value.includes('}')) confidence += 0.2;
        if (!value.includes('...') && !value.endsWith(',')) confidence += 0.1;
        if (value.length > 10) confidence += 0.1;
      }
    }

    // Decrease confidence for incomplete indicators
    if (rawText.includes('...') || rawText.endsWith(',')) confidence -= 0.2;
    if (Object.keys(args).length === 0) confidence = 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  reset(): void {
    this.accumulator = createSafeAccumulator();
  }

  getStats() {
    return {
      chunkCount: this.accumulator.chunkCount,
      errorCount: this.accumulator.errorCount,
      accumulatorSize: this.accumulator.rawText.length,
      duration: Date.now() - this.accumulator.startTime,
      healthy: isStreamingHealthy(this.accumulator)
    };
  }
}

// Maintain backward compatibility
export const ToolArgsParser = RobustToolArgsParser;
```

#### 3. Update Individual Tool Parsers
Apply this pattern to all streaming parsers:

```typescript
// Example: src/tools/communication-tools/done-tool.ts
export function parseStreamingArgs(accumulatedText: string): Record<string, any> | null {
  if (!accumulatedText || typeof accumulatedText !== 'string') {
    return null;
  }

  try {
    // Try complete JSON parse first
    const cleanedText = accumulatedText.trim();
    if (cleanedText.startsWith('{') && cleanedText.endsWith('}')) {
      return JSON.parse(cleanedText);
    }

    // Progressive parsing with better error handling
    const result: Record<string, any> = {};
    
    // Extract summary with validation
    const summaryMatch = cleanedText.match(/"summary":\s*"([^"]*(?:\\.[^"]*)*)"/);
    if (summaryMatch && summaryMatch[1]) {
      const summary = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      if (summary.length > 0 && summary.length < 1000) { // Reasonable length
        result.summary = summary;
      }
    }

    // Extract response with validation
    const responseMatch = cleanedText.match(/"response":\s*"([^"]*(?:\\.[^"]*)*)"/);
    if (responseMatch && responseMatch[1]) {
      const response = responseMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      if (response.length > 0 && response.length < 5000) { // Reasonable length
        result.response = response;
      }
    }

    return Object.keys(result).length > 0 ? result : null;

  } catch (error) {
    // Log parsing errors for debugging
    console.debug('Done tool parsing error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      textLength: accumulatedText.length,
      textPreview: accumulatedText.slice(0, 100)
    });
    return null;
  }
}
```

#### 4. Update Step Implementations
```typescript
// Update src/steps/analyst-step.ts
import { RobustToolArgsParser } from '../utils/streaming';

const analystExecution = async ({ inputData, runtimeContext }) => {
  // ... existing code ...

  // Initialize robust parser
  const toolArgsParser = new RobustToolArgsParser();
  toolArgsParser.registerParser('create-metrics-file', parseCreateMetricsArgs);
  toolArgsParser.registerParser('done', parseDoneArgs);
  toolArgsParser.registerParser('execute-sql', parseExecuteSqlArgs);
  toolArgsParser.registerParser('sequential-thinking', parseSequentialThinkingArgs);

  for await (const chunk of stream.fullStream) {
    try {
      const streamingResult = toolArgsParser.processChunk(chunk);
      
      if (streamingResult && streamingResult.confidence > 0.7) {
        // Only emit high-confidence streaming results
        console.log(`🔧 [${streamingResult.toolName}] Streaming (${Math.round(streamingResult.confidence * 100)}%):`, 
          streamingResult.partialArgs);
      }

    } catch (error) {
      console.warn('Streaming processing error:', error);
      // Continue processing - don't fail the entire workflow
    }
  }

  // Log parser statistics
  const parserStats = toolArgsParser.getStats();
  console.log('Streaming parser statistics:', parserStats);

  // ... rest of implementation
};
```

## Acceptance Criteria

- [ ] All streaming chunks are validated before processing
- [ ] Parser errors are logged but don't crash the workflow
- [ ] Resource limits prevent memory exhaustion
- [ ] Malformed data is handled gracefully
- [ ] Parser health monitoring prevents degraded performance
- [ ] Confidence scoring for streaming results
- [ ] Backward compatibility maintained

## Test Plan

- [ ] Test with malformed chunk data
- [ ] Test with oversized accumulator
- [ ] Test with high error rates
- [ ] Test parser fallback mechanisms
- [ ] Test confidence scoring accuracy
- [ ] Test resource limit enforcement
- [ ] Test streaming statistics collection

## Performance Improvements

- [ ] Chunked processing for large streams
- [ ] Optimized regex patterns
- [ ] Memory-efficient accumulator management
- [ ] Early termination for low-confidence streams

## Monitoring

Add streaming health metrics:
```typescript
export const streamingMetrics = {
  chunkProcessingTime: new Histogram('streaming_chunk_processing_time'),
  accumulatorSize: new Histogram('streaming_accumulator_size'),
  errorRate: new Gauge('streaming_error_rate'),
  parserConfidence: new Histogram('streaming_parser_confidence'),
};
```

## Notes

This ticket depends on resource limits (TICKET-005) for accumulator size validation. It significantly improves the robustness of real-time streaming updates to the UI.