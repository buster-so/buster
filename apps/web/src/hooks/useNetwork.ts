'use client';

import { useEffect, useState } from 'react';

interface NetworkState {
  online: boolean;
  since?: Date;
  rtt?: number;
  type?: string;
  downlink?: number;
  saveData?: boolean;
  effectiveType?: string;
}

export function useNetwork(): NetworkState {
  const [network, setNetwork] = useState<NetworkState>(() => ({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true
  }));

  useEffect(() => {
    function updateNetworkInfo() {
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- navigator.connection is not fully standardized
        const connection = (navigator as any).connection;
        setNetwork({
          online: navigator.onLine,
          since: new Date(),
          rtt: connection?.rtt,
          type: connection?.type,
          downlink: connection?.downlink,
          saveData: connection?.saveData,
          effectiveType: connection?.effectiveType
        });
      } else {
        setNetwork({
          online: navigator.onLine,
          since: new Date()
        });
      }
    }

    // Initial update
    updateNetworkInfo();

    // Add event listeners
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- navigator.connection is not fully standardized
      (navigator as any).connection?.addEventListener('change', updateNetworkInfo);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- navigator.connection is not fully standardized
        (navigator as any).connection?.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return network;
}
