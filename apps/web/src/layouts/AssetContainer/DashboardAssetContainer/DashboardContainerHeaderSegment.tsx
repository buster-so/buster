import { type ParsedLocation, useLocation } from '@tanstack/react-router';
import React, { useCallback, useMemo } from 'react';
import { AppSegmented } from '@/components/ui/segmented';
import { useIsDashboardReadOnly } from '@/context/Dashboards/useIsDashboardReadOnly';

interface DashboardContainerHeaderSegmentProps {
  dashboardId: string;
  dashboardVersionNumber: number | undefined;
}

export const DashboardContainerHeaderSegment: React.FC<DashboardContainerHeaderSegmentProps> =
  React.memo((props) => {
    const { dashboardId, dashboardVersionNumber } = props;

    const { isError } = useIsDashboardReadOnly({
      dashboardId,
    });

    if (isError) return <div />; //needed for sizing

    return <DashboardSegments {...props} />;
  });

DashboardContainerHeaderSegment.displayName = 'DashboardContainerHeaderSegment';

type DashboardView = 'content' | 'file';

const DashboardSegments: React.FC<DashboardContainerHeaderSegmentProps> = React.memo(() => {
  const location = useLocation({
    select: useCallback((location: ParsedLocation) => {
      // Get the last value after a slash in the pathname
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1] || '';
      return lastSegment;
    }, []),
  });

  const selectedView: DashboardView = useMemo(() => {
    if (location === 'content') return 'content';
    if (location === 'file') return 'file';
    return 'content';
  }, [location]);

  return (
    <AppSegmented
      type="button"
      from={'./' as '/app/dashboards/$dashboardId'}
      options={[
        {
          label: 'Dashboard',
          value: 'content' satisfies DashboardView,
        },
      ]}
      value={selectedView}
    />
  );
});

DashboardSegments.displayName = 'DashboardSegments';
