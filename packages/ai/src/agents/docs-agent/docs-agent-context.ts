import type { Sandbox } from '@buster/sandbox';
import { z } from 'zod';

// Best practice: Use const object for keys
export const DocsAgentContextKeys = {
  Sandbox: 'sandbox',
  TodoList: 'todoList',
  Notepad: 'notepad',
  ClarificationQuestions: 'clarificationQuestions',
  DataSourceId: 'dataSourceId',
} as const;

// Extract type from const object
export type DocsAgentContextKey = keyof typeof DocsAgentContextKeys;

export const ClarifyingQuestionSchema = z.object({
  issue: z.string(),
  context: z.string(),
  clarificationQuestion: z.string(),
});

export type MessageUserClarifyingQuestion = z.infer<typeof ClarifyingQuestionSchema>;

// Use the const keys in your schema
export const DocsAgentContextSchema = z.object({
  [DocsAgentContextKeys.Sandbox]: z.custom<Sandbox>(
    (val) => {
      return val && typeof val === 'object' && 'id' in val && 'fs' in val;
    },
    {
      message: 'Invalid Sandbox instance',
    }
  ),
  [DocsAgentContextKeys.TodoList]: z.string(),
  [DocsAgentContextKeys.Notepad]: z.string(),
  [DocsAgentContextKeys.ClarificationQuestions]: z.array(ClarifyingQuestionSchema),
  [DocsAgentContextKeys.DataSourceId]: z.string().uuid(),
});

export type DocsAgentContext = z.infer<typeof DocsAgentContextSchema>;
