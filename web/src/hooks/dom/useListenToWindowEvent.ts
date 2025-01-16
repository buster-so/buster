'use client';

import { useEffect } from 'react';

export const useListenToWindowEvent = (eventName: string, callback: (event: Event) => void) => {
  useEffect(() => {
    window.addEventListener(eventName, callback);

    return () => window.removeEventListener(eventName, callback);
  }, [eventName, callback]);
};
