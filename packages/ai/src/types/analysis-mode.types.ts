import { z } from 'zod';

/**
 * Shared analysis mode schema used across the workflow, agents, and tools
 */
export const AnalysisModeSchema = z.enum(['standard', 'investigation']);

/**
 * TypeScript type for analysis mode
 */
export type AnalysisMode = z.infer<typeof AnalysisModeSchema>;
