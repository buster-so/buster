import { DialogTitle } from '@radix-ui/react-dialog';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/buttons';
import { Xmark } from '@/components/ui/icons';
import { AppPageLayout } from '@/components/ui/layouts';
import { Dialog, DialogContent } from '@/components/ui/modal/ModalBase';
import { Text, Title } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { AppVerticalDiffCodeSplitter } from '../layouts/AppVerticalCodeSplitter/AppVerticalDiffCodeSplitter';

interface DashboardFilterDiffModallProps {
  open: boolean;
  onClose: () => void;
  metrics: {
    id: string;
    name: string;
    description: string;
    code: string;
    original_code: string;
    version_number: number;
  }[];
}

export const DashboardFilterDiffModall: React.FC<DashboardFilterDiffModallProps> = React.memo(
  ({ open, onClose, metrics }) => {
    const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);

    const selectedMetric = useMemo(() => {
      return metrics.find((metric) => metric.id === selectedMetricId);
    }, [metrics, selectedMetricId]);

    const onSelectMetric = useMemoizedFn((metricId: string) => {
      setSelectedMetricId(metricId);
    });

    useEffect(() => {
      if (metrics.length > 0) {
        setSelectedMetricId(metrics[0].id);
      }
    }, [metrics]);

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogTitle className="hidden">Dashboard Filter Diff Editor</DialogTitle>
        <DialogContent
          showClose={false}
          className="h-[80vh] max-h-[80vh] min-h-[75vh] w-full max-w-[1000px] min-w-[1000px] overflow-hidden">
          <div className="flex max-h-full w-full overflow-hidden">
            <ModalSidebar
              className="w-full max-w-[250px]"
              metrics={metrics}
              selectedMetricId={selectedMetricId}
              onSelectMetric={onSelectMetric}
              selectedMetric={selectedMetric}
            />
            <Content className="flex-1" selectedMetric={selectedMetric} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

DashboardFilterDiffModall.displayName = 'DashboardFilterDiffModall';

const ModalSidebar: React.FC<{
  className?: string;
  metrics: DashboardFilterDiffModallProps['metrics'];
  selectedMetricId: string | null;
  selectedMetric: DashboardFilterDiffModallProps['metrics'][number] | null | undefined;
  onSelectMetric: (metricId: string) => void;
}> = ({ selectedMetric, className, metrics, selectedMetricId, onSelectMetric }) => {
  const SidebarHeader = useMemo(() => {
    return (
      <div className="flex w-full items-center justify-between">
        <Title as={'h5'}>{selectedMetric?.name}</Title>
      </div>
    );
  }, [selectedMetric?.name]);

  return (
    <AppPageLayout
      headerSizeVariant="default"
      headerBorderVariant="ghost"
      header={SidebarHeader}
      scrollable
      className={cn('border-r', className)}>
      <div className="mx-2 my-1.5 flex flex-col space-y-0.5">
        {metrics.map((metric) => (
          <SidebarItem
            key={metric.id}
            metric={metric}
            selectedMetricId={selectedMetricId}
            onSelectMetric={onSelectMetric}
          />
        ))}
      </div>
    </AppPageLayout>
  );
};

const SidebarItem: React.FC<{
  className?: string;
  metric: DashboardFilterDiffModallProps['metrics'][number];
  selectedMetricId: string | null;
  onSelectMetric: (metricId: string) => void;
}> = ({ className, metric, selectedMetricId, onSelectMetric }) => {
  return (
    <div
      onClick={() => onSelectMetric(metric.id)}
      className={cn(
        'hover:bg-item-hover flex h-11 cursor-pointer flex-col space-y-0.5 rounded px-2 py-1.5',
        selectedMetricId === metric.id && 'bg-item-select hover:bg-item-select',
        className
      )}>
      <Title as={'h5'}>{metric.name}</Title>
      <Text size={'sm'} truncate variant={'secondary'}>
        {metric.description}
      </Text>
    </div>
  );
};

const Content: React.FC<{
  className?: string;
  selectedMetric: DashboardFilterDiffModallProps['metrics'][number] | null | undefined;
}> = ({ className, selectedMetric }) => {
  return (
    <AppPageLayout
      headerSizeVariant="default"
      headerClassName="px-3!"
      header={useMemo(
        () => (
          <div className="flex w-full items-center justify-end">
            <Button variant="ghost" prefix={<Xmark />} />
          </div>
        ),
        []
      )}
      className={cn('overflow-hidden', className)}>
      <div className="bg-item-hover h-full w-full p-5">
        {selectedMetric && (
          <AppVerticalDiffCodeSplitter
            originalValue={selectedMetric.original_code}
            value={selectedMetric.code}
            setValue={() => {}}
            language="sql"
            runSQLError={undefined}
            onRunQuery={() => Promise.resolve()}
            data={[]}
            defaultLayout={['300px', 'auto']}
            fetchingData={false}
            autoSaveId="dashboard-filter-diff-modal"
            fileName={selectedMetric.name}
            versionNumber={selectedMetric.version_number}
          />
        )}

        {!selectedMetric && (
          <div className="bg-background flex h-full w-full items-center justify-center rounded border p-5">
            <Text variant={'secondary'}>Select a metric to view the diff</Text>
          </div>
        )}
      </div>
    </AppPageLayout>
  );
};
