import { ClientOnly, Outlet, useLocation, useNavigate, useSearch } from '@tanstack/react-router';
import { lazy, Suspense, useRef, useTransition } from 'react';
import { z } from 'zod';
import { AppSplitter, type LayoutSize } from '@/components/ui/layouts/AppSplitter';
import { useGetMetricParams } from '@/context/Metrics/useGetMetricParams';
import { useGetReportParams } from '@/context/Reports/useGetReportParams';
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

export const component = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { metricId, metricVersionNumber } = useGetMetricParams();
  const { reportId } = useGetReportParams();
  const editMode = useSearch({
    strict: false,
    select: (v) => v.editMode ?? false,
  });

  const isMetricEditMode = useIsMetricEditMode();
  const splitterRef = useMetricEditSplitter();
  const toggleEditMode = useMetricEditToggle();

  const hasSeenMetricEditMode = useRef(editMode);

  const defaultLayout = isMetricEditMode ? defaultLayoutOpen : defaultLayoutClosed;
  const cacheId = reportId;

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
          <MetricViewChartController
            metricId={metricId}
            versionNumber={metricVersionNumber}
            cacheId={cacheId}
          />
        }
        rightChildren={
          <RightChildren metricId={metricId} renderChart={hasSeenMetricEditMode.current} />
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

const RightChildren = ({ metricId, renderChart }: { metricId: string; renderChart: boolean }) => {
  return renderChart ? (
    <Suspense fallback={<CircleSpinnerLoaderContainer />}>
      <MetricEditController metricId={metricId} />
    </Suspense>
  ) : null;
};
