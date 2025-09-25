import { ClientOnly, Outlet, useLocation, useNavigate, useSearch } from '@tanstack/react-router';
import { lazy, Suspense, useRef } from 'react';
import { z } from 'zod';
import { LazyErrorBoundary } from '@/components/features/global/LazyErrorBoundary';
import { AppSplitter, type LayoutSize } from '@/components/ui/layouts/AppSplitter';
import { useGetMetricParams } from '@/context/Metrics/useGetMetricParams';
import { MetricViewChartController } from '@/controllers/MetricController/MetricViewChartController';
import { useMount } from '@/hooks/useMount';
import {
  useIsMetricEditMode,
  useMetricEditSplitter,
  useMetricEditToggle,
} from '@/layouts/AssetContainer/MetricAssetContainer/MetricContextProvider';
import { CircleSpinnerLoaderContainer } from '../../../components/ui/loaders';

const defaultLayoutClosed: LayoutSize = ['auto', '0px'];
const defaultLayoutOpen: LayoutSize = ['auto', '300px'];
const autoSaveId = `metric-chart-layout`;

export const validateSearch = z.object({
  editMode: z.boolean().optional(),
});

const stableEditModeSearchSelector = (state: { editMode?: boolean }) => state.editMode ?? false;
export const component = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { metricId, metricVersionNumber } = useGetMetricParams();
  const editMode = useSearch({
    strict: false,
    select: stableEditModeSearchSelector,
  });

  const isMetricEditMode = useIsMetricEditMode();
  const splitterRef = useMetricEditSplitter();
  const toggleEditMode = useMetricEditToggle();

  const hasSeenMetricEditMode = useRef(editMode);

  const defaultLayout = isMetricEditMode ? defaultLayoutOpen : defaultLayoutClosed;

  useMount(() => {
    if (editMode) {
      setTimeout(() => {
        navigate({
          to: location.pathname,
          search: {},
          replace: true,
        }).then(() => {
          toggleEditMode(true);
        });
      }, 250);
    }
  });

  if (isMetricEditMode && !hasSeenMetricEditMode.current) {
    hasSeenMetricEditMode.current = true;
  }

  return (
    <ClientOnly>
      <AppSplitter
        ref={splitterRef}
        autoSaveId={autoSaveId}
        defaultLayout={defaultLayout}
        initialLayout={defaultLayout}
        preserveSide="right"
        leftChildren={
          <MetricViewChartController metricId={metricId} versionNumber={metricVersionNumber} />
        }
        rightChildren={
          <RightChildren
            metricId={metricId}
            metricVersionNumber={metricVersionNumber}
            renderChart={hasSeenMetricEditMode.current}
          />
        }
        rightPanelMinSize={'250px'}
        rightPanelMaxSize={'500px'}
        allowResize={isMetricEditMode}
      />
      <Outlet />
    </ClientOnly>
  );
};

const MetricEditController = lazy(() =>
  import('@/controllers/MetricController/MetricViewChartController/MetricEditController').then(
    (x) => ({
      default: x.MetricEditController,
    })
  )
);

const RightChildren = ({
  metricId,
  metricVersionNumber,
  renderChart,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
  renderChart: boolean;
}) => {
  return renderChart ? (
    <LazyErrorBoundary>
      <Suspense fallback={<CircleSpinnerLoaderContainer />}>
        <MetricEditController metricId={metricId} metricVersionNumber={metricVersionNumber} />
      </Suspense>
    </LazyErrorBoundary>
  ) : null;
};
