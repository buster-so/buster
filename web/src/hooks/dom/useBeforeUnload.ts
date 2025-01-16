'use client';

import { useListenToWindowEvent } from './useListenToWindowEvent';

export const useBeforeUnload = (callback: (event: BeforeUnloadEvent) => void) => {
  useListenToWindowEvent('beforeunload', callback);
};
