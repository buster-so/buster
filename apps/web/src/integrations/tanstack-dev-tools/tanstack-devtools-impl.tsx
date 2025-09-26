import { ClientOnly } from '@tanstack/react-router';
import sample from 'lodash/sample';
import React, { lazy, Suspense, useState } from 'react';
import { LazyErrorBoundary } from '@/components/features/global/LazyErrorBoundary';
import { useMount } from '@/hooks/useMount';
import { isServer } from '@/lib/window';
import image1 from './images/image1.png';
import image2 from './images/image2.png';
import image3 from './images/image3.png';
import image4 from './images/image4.png';
import image5 from './images/image5.png';
import image6 from './images/image6.png';
import image7 from './images/image7.png';

const isProduction = import.meta.env.PROD;

const arrayOfImages = [image1, image2, image3, image4, image5, image6, image7];

const randomImage = sample(arrayOfImages);

// Only create lazy components if we're in the browser
const LazyTanstackDevtools = !import.meta.env.SSR
  ? lazy(() =>
      import('@tanstack/react-devtools').then((mod) => ({
        default: mod.TanStackDevtools,
      }))
    )
  : () => null;

const LazyTanstackDevtoolsInProd = !import.meta.env.SSR
  ? lazy(() =>
      import('@tanstack/react-devtools').then((mod) => ({
        default: mod.TanStackDevtools,
      }))
    )
  : () => null;

const LazyReactQueryDevtoolsPanel = !import.meta.env.SSR
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((mod) => ({
        default: mod.ReactQueryDevtoolsPanel,
      }))
    )
  : () => null;

const LazyReactQueryDevtoolsPanelInProd = !import.meta.env.SSR
  ? lazy(() =>
      import('@tanstack/react-query-devtools/production').then((mod) => ({
        default: mod.ReactQueryDevtoolsPanel,
      }))
    )
  : () => null;

const LazyTanStackRouterDevtoolsPanel = !import.meta.env.SSR
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((mod) => ({
        default: isProduction
          ? mod.TanStackRouterDevtoolsPanelInProd
          : mod.TanStackRouterDevtoolsPanel,
      }))
    )
  : () => null;

const LazyMetricStoreDevtools = !import.meta.env.SSR
  ? lazy(() =>
      import('./metric-store-devtools').then((mod) => ({
        default: mod.default,
      }))
    )
  : () => null;

// The actual devtools component implementation
const TanstackDevtoolsImpl: React.FC = React.memo(() => {
  useMount(() => {
    if (import.meta.env.PROD) console.info('🐓 Rendering TanstackDevtoolsImpl');
  });
  const isServerOrSSR = isServer && import.meta.env.SSR;

  const TanstackDevtools = isProduction ? LazyTanstackDevtoolsInProd : LazyTanstackDevtools;
  const ReactQueryDevtoolsPanel = isProduction
    ? LazyReactQueryDevtoolsPanelInProd
    : LazyReactQueryDevtoolsPanel;

  if (isServerOrSSR) {
    return null;
  }

  return (
    <LazyErrorBoundary>
      <ClientOnly>
        <Suspense fallback={<span className="hidden">...</span>}>
          <TanstackDevtools
            config={{
              position: 'bottom-left',
              hideUntilHover: true,
              defaultOpen: false,
              openHotkey: ['Meta', 'D'],
              triggerImage: randomImage,
            }}
            plugins={[
              {
                name: 'Tanstack Query',
                render: (
                  <Suspense fallback={<span className="hidden">...</span>}>
                    <ReactQueryDevtoolsPanel />
                  </Suspense>
                ),
              },
              {
                name: 'Tanstack Router',
                render: (
                  <Suspense fallback={<span className="hidden">...</span>}>
                    <LazyTanStackRouterDevtoolsPanel />
                  </Suspense>
                ),
              },
              {
                name: 'Metric Original Store',
                render: (
                  <Suspense fallback={<span className="hidden">...</span>}>
                    <LazyMetricStoreDevtools />
                  </Suspense>
                ),
              },
            ]}
          />
        </Suspense>
      </ClientOnly>
    </LazyErrorBoundary>
  );
});

TanstackDevtoolsImpl.displayName = 'TanstackDevtoolsImpl';

export default TanstackDevtoolsImpl;
