import { z } from 'zod';
import type { ReportElement, ReportElements } from './report-elements';
import { ReportElementSchema } from './report-elements';

export const ReportListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  file_name: z.string(),
  description: z.string(),
  created_by_id: z.string(),
  created_by_name: z.string().nullable(),
  created_by_avatar: z.string().nullable(),
  last_edited: z.string(),
  is_shared: z.boolean(),
});

export const ReportIndividualResponseSchema: z.ZodType<{
  id: string;
  name: string;
  file_name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  publicly_accessible: boolean;
  content: ReportElement[];
}> = z.object({
  id: z.string(),
  name: z.string(),
  file_name: z.string(),
  description: z.string(),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  publicly_accessible: z.boolean(),
  content: z.array(ReportElementSchema) as z.ZodType<ReportElements>,
});

export type ReportListItem = z.infer<typeof ReportListItemSchema>;
export type ReportIndividualResponse = z.infer<typeof ReportIndividualResponseSchema>;
