import type { LibraryLayout } from '@/controllers/LibraryController/schema';
import { useCookieState } from '@/hooks/useCookieState';

export const LAYOUT_COOKIE_NAME = 'library-layout';

export const useLibraryLayout = ({ initialLayout }: { initialLayout?: LibraryLayout }) => {
  const [layout, setLayout] = useCookieState<LibraryLayout>(LAYOUT_COOKIE_NAME, {
    initialValue: initialLayout,
  });
  return { layout: layout ?? initialLayout ?? 'grid', setLayout };
};
