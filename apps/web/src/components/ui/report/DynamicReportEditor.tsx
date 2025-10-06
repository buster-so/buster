import { lazy, Suspense } from 'react';
import { LazyErrorBoundary } from '@/components/features/global/LazyErrorBoundary';
import { type UsePageReadyOptions, usePageReady } from '@/hooks/usePageReady';
import type { ReportEditorProps } from './ReportEditor';
import { ReportEditorSkeleton } from './ReportEditorSkeleton';

const DynamicReportEditorBase = lazy(() =>
  import('@/components/ui/report/ReportEditor').then((mod) => {
    return { default: mod.ReportEditor };
  })
);

export interface DynamicReportEditorProps extends ReportEditorProps {
  loadingOptions?: UsePageReadyOptions;
}

export const DynamicReportEditor = ({ loadingOptions, ...props }: DynamicReportEditorProps) => {
  const { delay = 200, idleTimeout = 500, forceImmediate = false } = loadingOptions || {};

  const { isReady: isPageReady } = usePageReady({
    ...loadingOptions,
    delay,
    idleTimeout,
    forceImmediate,
  });

  // Show skeleton only when not ready (not during transition)
  if (!isPageReady) {
    return <ReportEditorSkeleton />;
  }

  return (
    <LazyErrorBoundary>
      <Suspense fallback={<ReportEditorSkeleton />}>
        <DynamicReportEditorBase {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export default DynamicReportEditor;
