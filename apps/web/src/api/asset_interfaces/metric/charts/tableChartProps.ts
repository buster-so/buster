import { z } from 'zod/v4';

export const TableChartPropsSchema = z.object({
  tableColumnOrder: z.nullable(z.array(z.string())).default(null),
  tableColumnWidths: z.nullable(z.record(z.string(), z.number())).default(null),
  tableHeaderBackgroundColor: z.nullable(z.string()).default(null),
  tableHeaderFontColor: z.nullable(z.string()).default(null),
  tableColumnFontColor: z.nullable(z.string()).default(null)
});

export type TableChartProps = z.infer<typeof TableChartPropsSchema>;
