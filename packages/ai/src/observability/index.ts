/**
 * Observability Module
 *
 * Re-exports Braintrust observability utilities for use across the monorepo.
 * This centralizes the braintrust dependency in the AI package and allows
 * other apps (CLI, Trigger) to use observability without bundling braintrust separately.
 *
 * Entry points (CLI services, Trigger tasks) should:
 * - Import initLogger from @buster/ai
 * - Initialize with initLogger({ apiKey, projectName })
 * - Flush with await logger.flush() before exit
 *
 * Agents/workflows (inside @buster/ai) can:
 * - Import wrapTraced and currentSpan from braintrust directly
 * - Wrap functions with wrapTraced for tracing
 * - Add metadata with currentSpan().log()
 */

export type { Logger } from 'braintrust';
export { currentSpan, initLogger, wrapTraced } from 'braintrust';
