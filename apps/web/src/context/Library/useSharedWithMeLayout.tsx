import Cookies from 'js-cookie';
import type { LibraryLayout } from '@/controllers/LibraryController/schema';
import { useCookieState } from '@/hooks/useCookieState';

export const SHARED_WITH_ME_LAYOUT_COOKIE_NAME = 'shared-with-me-layout';

export const useSharedWithMeLayout = ({ initialLayout }: { initialLayout?: LibraryLayout }) => {
  const [layout, setLayout] = useCookieState<LibraryLayout>(SHARED_WITH_ME_LAYOUT_COOKIE_NAME, {
    initialValue: initialLayout,
  });
  return { layout: layout ?? initialLayout ?? 'grid', setLayout };
};

export const setLibraryLayoutCookie = (layout: LibraryLayout) => {
  try {
    Cookies.set(SHARED_WITH_ME_LAYOUT_COOKIE_NAME, JSON.stringify({ value: layout }), {
      expires: 180, // 180 days
    });
  } catch (error) {
    console.error('Error setting library layout cookie', error);
  }
};
