import { useMemo } from 'react';

interface BrowserInfo {
  isEdge: boolean;
  isChrome: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  browserName: string;
}

export function useBrowserDetection(): BrowserInfo {
  const browserInfo = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        isEdge: false,
        isChrome: false,
        isSafari: false,
        isFirefox: false,
        browserName: 'unknown',
      };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isEdge = userAgent.includes('edg/');
    const isChrome = userAgent.includes('chrome') && !isEdge;
    const isSafari = userAgent.includes('safari') && !isChrome && !isEdge;
    const isFirefox = userAgent.includes('firefox');

    let browserName = 'unknown';
    if (isEdge) browserName = 'edge';
    else if (isChrome) browserName = 'chrome';
    else if (isSafari) browserName = 'safari';
    else if (isFirefox) browserName = 'firefox';

    return {
      isEdge,
      isChrome,
      isSafari,
      isFirefox,
      browserName,
    };
  }, []);

  return browserInfo;
}
