import { cookies } from 'next/headers';
import { createAutoSaveId } from './helper';

export const DEFAULT_LAYOUT = ['230px', 'auto'];

export function getAppSplitterLayout(
  id: string = '',
  defaultLayout: string[] = DEFAULT_LAYOUT
): [string, string] {
  const key = createAutoSaveId(id);
  const layout = cookies().get(key);
  if (layout) {
    return JSON.parse(layout.value) as [string, string];
  }
  return defaultLayout as [string, string];
}
