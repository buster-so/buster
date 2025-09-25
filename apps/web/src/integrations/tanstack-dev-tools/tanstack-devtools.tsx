import { ClientOnly } from '@tanstack/react-router';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { LazyErrorBoundary } from '@/components/features/global/LazyErrorBoundary';
import { isDev } from '@/config/dev';
import { env } from '@/env';
import { isServer } from '@/lib/window';

const ENABLE_TANSTACK_PANEL =
  (env.VITE_PUBLIC_ENABLE_TANSTACK_PANEL === 'true' || isDev) && !isServer;

// Lazy load the actual devtools component - only if not SSR
const LazyTanstackDevtools = !isServer
  ? lazy(() =>
      import('./tanstack-devtools-impl').then((mod) => ({
        default: mod.default,
      }))
    )
  : () => null;

// Export component with Suspense wrapper
export const TanstackDevtools: React.FC = React.memo(() => {
  // Track if we're on the client side
  const [mounted, setMounted] = useState(false);
  const [useDevTools, setUseDevTools] = useState(import.meta.env.DEV);

  useEffect(() => {
    // Set to true only after mount (client-side only)
    setMounted(true);
  }, []);

  useHotkeys(
    'shift+d+t', //shaft (T)anstack+(D)evtools
    () => {
      console.log('🐓 Setting useDevTools to true');
      setUseDevTools(true);
    },
    { enabled: ENABLE_TANSTACK_PANEL, preventDefault: true }
  );

  if (!ENABLE_TANSTACK_PANEL || !mounted || !useDevTools) {
    return null;
  }

  return (
    <ClientOnly>
      <LazyErrorBoundary>
        <Suspense fallback={<span className="hidden">...</span>}>
          <LazyTanstackDevtools />
        </Suspense>
      </LazyErrorBoundary>
    </ClientOnly>
  );
});

TanstackDevtools.displayName = 'TanstackDevtools';
