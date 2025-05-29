import { determineFontColorContrast } from '@/lib/colors';
import type { Context } from 'chartjs-plugin-datalabels';

export const dataLabelFontColorContrast = (context: Context) => {
  const color = context.dataset.backgroundColor as string;
  return determineFontColorContrast(color);
};
