'use client';

import { useMount, useUnmount } from 'ahooks';

export const usePreventBackwardNavigation = () => {
  useMount(() => {
    document.documentElement.style.overscrollBehaviorX = 'none';
    document.body.style.overscrollBehaviorX = 'none';
  });

  useUnmount(() => {
    document.documentElement.style.overscrollBehaviorX = 'auto';
    document.body.style.overscrollBehaviorX = 'auto';
  });
};
