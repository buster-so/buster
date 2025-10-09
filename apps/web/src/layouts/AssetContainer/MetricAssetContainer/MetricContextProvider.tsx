import { type ParsedLocation, useLocation, useNavigate } from '@tanstack/react-router';
import { useCallback, useRef, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { useGetMetricParams } from '@/context/Metrics/useGetMetricParams';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

const useMetricAssetContext = () => {
  const splitterRef = useRef<AppSplitterRef>(null);
  const pathname = useLocation({ select: useCallback((x: ParsedLocation) => x.pathname, []) });
  const [isMetricEditMode, setIsMetricEditMode] = useState(false);
  const [versionHistoryMode, setVersionHistoryMode] = useState<number | false>(false);
  const { metricId = '' } = useGetMetricParams();
  const navigate = useNavigate();

  const toggleEditMode = useMemoizedFn(
    async (v?: boolean, params?: { metricId?: string; metricVersionNumber?: number }) => {
      const isChartPage = pathname.includes('/chart');

      if (!isChartPage) {
        await navigate({
          unsafeRelative: 'path',
          to: '../chart' as '/app/metrics/$metricId/chart',
          params: (prev) => ({ ...prev, metricId, ...params }),
          search: (prev) => prev,
        });
      }

      const toggleOff = v !== undefined ? v : !isMetricEditMode;
      setIsMetricEditMode(toggleOff);

      if (!splitterRef.current) {
        console.warn('splitterRef is not set');
        return;
      }

      if (!toggleOff) {
        await splitterRef.current?.animateWidth('0px', 'right', 300);
        await navigate({
          unsafeRelative: 'path',
          to: '../chart' as '/app/metrics/$metricId/chart',
          params: (prev) => ({ ...prev, metricId, ...params }),
          search: (prev) => prev,
        });
      } else {
        splitterRef.current?.animateWidth('300px', 'right', 300);
        await navigate({
          unsafeRelative: 'path',
          to: '../chart' as '/app/metrics/$metricId/chart',
          params: (prev) => ({ ...prev, ...params, metricId }),
          search: (prev) => prev,
        });
      }
    }
  );

  const openMetricVersionHistoryMode = useMemoizedFn((versionNumber: number) => {
    setVersionHistoryMode(versionNumber);
  });

  const closeVersionHistoryMode = useMemoizedFn(() => {
    setVersionHistoryMode(false);
  });

  return {
    toggleEditMode,
    openMetricVersionHistoryMode,
    closeVersionHistoryMode,
    splitterRef,
    isMetricEditMode,
    versionHistoryMode,
  };
};

const MetricAssetContext = createContext<ReturnType<typeof useMetricAssetContext>>(
  {} as ReturnType<typeof useMetricAssetContext>
);

export const MetricAssetContextProvider = ({
  children,
}: {
  children:
    | React.ReactNode
    | ((context: ReturnType<typeof useMetricAssetContext>) => React.ReactNode);
}) => {
  const context = useMetricAssetContext();

  return (
    <MetricAssetContext.Provider value={context}>
      {typeof children === 'function' ? children(context) : children}
    </MetricAssetContext.Provider>
  );
};

const stableIsMetricEditMode = (x: ReturnType<typeof useMetricAssetContext>) => x.isMetricEditMode;
export const useIsMetricEditMode = () => {
  return useContextSelector(MetricAssetContext, stableIsMetricEditMode);
};

const stableMetricEditSplitter = (x: ReturnType<typeof useMetricAssetContext>) => x.splitterRef;
export const useMetricEditSplitter = () => {
  return useContextSelector(MetricAssetContext, stableMetricEditSplitter);
};

const stableToggleEditMode = (x: ReturnType<typeof useMetricAssetContext>) => x.toggleEditMode;
export const useMetricEditToggle = () => {
  return useContextSelector(MetricAssetContext, stableToggleEditMode);
};

const stableVersionHistorySelector = (x: ReturnType<typeof useMetricAssetContext>) => ({
  versionHistoryMode: x.versionHistoryMode,
  openMetricVersionHistoryMode: x.openMetricVersionHistoryMode,
  closeVersionHistoryMode: x.closeVersionHistoryMode,
});

export const useMetricVersionHistoryMode = () => {
  const { closeVersionHistoryMode, openMetricVersionHistoryMode, versionHistoryMode } =
    useContextSelector(MetricAssetContext, stableVersionHistorySelector);
  return { versionHistoryMode, openMetricVersionHistoryMode, closeVersionHistoryMode };
};
