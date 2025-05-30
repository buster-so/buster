# Bash Tool Implementation Plan

## Overview

Migrate the Rust `bash_tool.rs` to TypeScript using Mastra framework. This tool executes bash commands with security restrictions.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/cli_tools/bash_tool.rs`
- **Purpose**: Execute bash commands in a controlled environment
- **Input**: Command string, optional timeout, optional working directory
- **Output**: Command output (stdout/stderr) and exit status
- **Key Features**:
  - Timeout handling
  - Working directory support
  - Output streaming/buffering
  - Exit code handling
  - Security restrictions (likely sandboxed)

## Dependencies
- Node.js child_process module
- Node.js fs/promises for file operations
- Security validation utilities
- Process isolation mechanisms
- @mastra/core for tool framework
- Braintrust for tracing

## Implementation Pattern
**Type**: Function-based
**Wave**: 1
**AI Agent Time**: 3 minutes
**Depends on**: None (foundational tool)

## TypeScript Implementation

### Tool Definition

```typescript
export const bashTool = createTool({
  id: 'bash-execute',
  description: 'Execute bash commands with security restrictions and timeout support',
  inputSchema: z.object({
    command: z.string().describe('Bash command to execute'),
    timeout: z.number().optional().describe('Timeout in milliseconds (default: 30000)'),
    workingDir: z.string().optional().describe('Working directory for command execution'),
    captureOutput: z.boolean().optional().describe('Whether to capture command output')
  }),
  outputSchema: z.object({
    stdout: z.string(),
    stderr: z.string(),
    exitCode: z.number(),
    success: z.boolean(),
    duration: z.number(),
    command: z.string()
  }),
  execute: async ({ context }) => {
    return await executeBashCommand(context);
  },
});
```

### Dependencies Required

```typescript
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { wrapTraced } from 'braintrust';
```

### Core Implementation

```typescript
const executeBashCommand = wrapTraced(
  async (params: BashToolParams) => {
    const { command, timeout = 30000, workingDir, captureOutput = true } = params;
    
    return new Promise((resolve, reject) => {
      const process = spawn('bash', ['-c', command], {
        cwd: workingDir || process.cwd(),
        timeout,
        stdio: captureOutput ? 'pipe' : 'inherit'
      });
      
      let stdout = '';
      let stderr = '';
      const startTime = Date.now();
      
      if (captureOutput) {
        process.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        
        process.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
      }
      
      process.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          success: code === 0,
          duration: Date.now() - startTime,
          command
        });
      });
      
      process.on('error', (error) => {
        reject(new Error(`Command execution failed: ${error.message}`));
      });
    });
  },
  { name: 'bash-execute' }
);
```

## Test Strategy

### Unit Tests (`bash-tool.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Command execution validation
- Timeout handling
- Security command filtering
- Process management edge cases

### Integration Tests (`bash-tool.integration.test.ts`)
- Real filesystem/process integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Resource limit enforcement
- Process isolation verification

## Security Considerations

1. **Command Whitelist**: Implement whitelist of allowed commands
2. **Path Restrictions**: Restrict access to system directories
3. **User Permissions**: Run with limited user permissions
4. **Resource Limits**: CPU and memory limits
5. **Network Restrictions**: Block network access if needed

## Implementation Dependencies

### New TypeScript Packages

- `child_process` (Node.js built-in)
- Command validation utilities
- Security sandbox implementation

### Missing from TypeScript

- Rust's security model needs to be replicated
- Process isolation mechanisms
- Resource limiting capabilities

## AI Agent Implementation Time

**Estimated Time**: 3 minutes
**Complexity**: Medium-High

## Implementation Priority

**High** - Core functionality tool that many other tools will depend on.

## Notes

- Consider using Docker/containers for additional isolation
- Implement comprehensive logging for security auditing
- May need custom security policy configuration
- Should integrate with system monitoring tools