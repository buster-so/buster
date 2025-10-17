import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { LazyErrorBoundary } from '@/components/features/global/LazyErrorBoundary';
import { PreparingYourRequestLoader } from './LoadingComponents/ChartLoadingComponents';

const BusterChartLazy = lazy(() =>
  import('./BusterChart').then((mod) => ({ default: mod.BusterChart }))
);

export const BusterChartDynamic = (props: Parameters<typeof BusterChartLazy>[0]) => (
  <LazyErrorBoundary>
    <Suspense fallback={<PreparingYourRequestLoader text="Loading chart..." />}>
      <BusterChartLazy {...props} />
    </Suspense>
  </LazyErrorBoundary>
);

BusterChartDynamic.preload = async () => await import('./BusterChart');
