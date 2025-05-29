import { makeHumanReadble } from '@/lib/text';

export const defaultHeaderFormat = (v: unknown) => makeHumanReadble(v);
export const defaultCellFormat = (v: unknown) => v;
