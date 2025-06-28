import { z } from 'zod/v4';

export const TableChartPropsSchema = z.object({
  tableColumnOrder: z.nullable(z.array(z.string())).default(null).optional(),
  tableColumnWidths: z.nullable(z.record(z.string(), z.number())).default(null).optional(),
  tableHeaderBackgroundColor: z.nullable(z.string()).default(null).optional(),
  tableHeaderFontColor: z.nullable(z.string()).default(null).optional(),
  tableColumnFontColor: z.nullable(z.string()).default(null).optional()
});

export type TableChartProps = z.infer<typeof TableChartPropsSchema>;
