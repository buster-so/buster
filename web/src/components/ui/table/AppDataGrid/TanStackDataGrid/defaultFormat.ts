import { makeHumanReadble } from '@/lib/text';

export const defaultHeaderFormat = (v: string | number | null | Date) =>
  makeHumanReadble(v as string);
export const defaultCellFormat = (v: string | number | null | Date) => String(v);
