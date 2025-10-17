import type { LayoutSize } from '@/components/ui/layouts/AppLayout';
import { createAutoSaveId } from '@/components/ui/layouts/AppSplitter/create-auto-save-id';
import { getCookie } from './getCookie';

export const getAppLayout = async ({
  id,
  preservedSide = 'left',
}: {
  id: string;
  preservedSide?: 'left' | 'right';
}) => {
  const cookieName = createAutoSaveId(id);
  const cookieValue = await getCookie({ data: { cookieName } });

  if (!cookieValue) {
    return null;
  }

  try {
    const { value } = JSON.parse(cookieValue) as { value: number };
    const isLeft = preservedSide !== 'right';
    const layout: LayoutSize = isLeft ? [`${value}px`, 'auto'] : ['auto', `${value}px`];
    return layout;
  } catch (error) {
    console.error('Error parsing cookie value', error);
    return null;
  }
};
