import { z } from 'zod/v4';
import { ComboChartAxisSchema } from './axisInterfaces';

export const ComboChartPropsSchema = z.object({
  // Required for Combo
  comboChartAxis: ComboChartAxisSchema
});

export type ComboChartProps = z.infer<typeof ComboChartPropsSchema>;
