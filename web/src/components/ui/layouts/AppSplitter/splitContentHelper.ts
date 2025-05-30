'use server';

import { cookies } from 'next/headers';
import { createAutoSaveId } from './helper';

const DEFAULT_LAYOUT = ['230px', 'auto'];

export async function getAppSplitterLayout(
  id = '',
  defaultLayout: string[] = DEFAULT_LAYOUT
): Promise<[string, string]> {
  const key = createAutoSaveId(id);
  const layout = cookies().get(key);
  if (layout) {
    return JSON.parse(layout.value) as [string, string];
  }
  return defaultLayout as [string, string];
}
