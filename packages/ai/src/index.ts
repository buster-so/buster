export type { ModelMessage } from 'ai';

// Observability exports (Braintrust) - selective exports to avoid pulling in dependencies
export { initLogger, wrapTraced, currentSpan } from './observability';
export type { Logger } from './observability';
export { initBraintrustLogger } from './utils/logger';

// Workflow exports - only export main workflow functions and public types
export { runAnalystWorkflow } from './workflows';
export type { AnalystWorkflowInput } from './workflows/analyst-agent-workflow/analyst-workflow';
export type { AnalystWorkflowOutput } from './workflows/analyst-agent-workflow/workflow-output.types';
export { default as postProcessingWorkflow } from './workflows/message-post-processing-workflow/message-post-processing-workflow';
export type { PostProcessingWorkflowOutput } from './workflows/message-post-processing-workflow/message-post-processing-workflow';

// Utils exports - selective to avoid pulling in all internal utilities
export {
  isOverloadedError,
  withAgentRetry,
  retryStream,
  recoverMessages,
  executeStreamAttempt,
  handleFailedAttempt,
  createRetryExecutor,
  composeMiddleware,
  retryMiddleware,
} from './utils/with-agent-retry';
export { withStepRetry, createRetryableStep, runStepsWithRetry } from './utils/with-step-retry';
export type { StepRetryOptions } from './utils/with-step-retry';
export { extractUserAndDoneToolMessages } from './utils/memory/extract-user-and-done-tool-messages';

// Embeddings exports
export * from './embeddings';

// Tasks exports
export * from './tasks';
// Export tool types for CLI usage
export type {
  IdleInput,
  IdleOutput,
} from './tools/communication-tools/idle-tool/idle-tool';
export type {
  BashToolInput,
  BashToolOutput,
} from './tools/file-tools/bash-tool/bash-tool';
export type {
  EditFileToolInput,
  EditFileToolOutput,
} from './tools/file-tools/edit-file-tool/edit-file-tool';
export type {
  GrepToolInput,
  GrepToolOutput,
} from './tools/file-tools/grep-tool/grep-tool';
export type {
  LsToolInput,
  LsToolOutput,
} from './tools/file-tools/ls-tool/ls-tool';
export type {
  ReadFileToolInput,
  ReadFileToolOutput,
} from './tools/file-tools/read-file-tool/read-file-tool';
export type {
  WriteFileToolInput,
  WriteFileToolOutput,
} from './tools/file-tools/write-file-tool/write-file-tool';
export * from './utils';
export * from './workflows';
