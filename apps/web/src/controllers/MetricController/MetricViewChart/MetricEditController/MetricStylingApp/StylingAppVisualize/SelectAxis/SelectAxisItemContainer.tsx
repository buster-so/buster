import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import React, { useMemo } from 'react';
import type { ChartEncodes, IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { ErrorBoundary } from '@/components/ui/error';
import { useUpdateMetricChart } from '@/context/Metrics';
import { useMemoizedFn } from '@/hooks';
import { CollapseDelete } from '../../Common/CollapseDelete';
import { chartTypeToAxis, type SelectAxisContainerId, zoneIdToAxis } from './config';
import { SelectAxisDropdownContent } from './SelectAxisColumnContent';
import { SelectAxisItemLabel } from './SelectAxisItemLabel';
import { useSelectAxisContextSelector } from './useSelectAxisContext';

interface SelectAxisItemContainerProps {
  id: string;
  zoneId: SelectAxisContainerId;
  isPlaceholder?: boolean;
  //DRAGGING PROPERTIES
  isDragging?: boolean;
  style?: React.CSSProperties;
  listeners?: SyntheticListenerMap;
  attributes?: DraggableAttributes;
}

export const SelectAxisItemContainer = React.memo(
  React.forwardRef<HTMLDivElement, SelectAxisItemContainerProps>(
    ({ id, zoneId, isPlaceholder, ...draggingProps }, ref) => {
      const columnLabelFormat: undefined | IColumnLabelFormat = useSelectAxisContextSelector(
        (x) => x.columnLabelFormats[id]
      );
      const selectedAxis = useSelectAxisContextSelector((x) => x.selectedAxis);
      const selectedChartType = useSelectAxisContextSelector((x) => x.selectedChartType);
      const { onUpdateMetricChartConfig } = useUpdateMetricChart();

      const onDelete = useMemoizedFn(() => {
        if (selectedAxis && selectedChartType) {
          const axis = zoneIdToAxis[zoneId] as keyof ChartEncodes;
          if (!axis || !selectedAxis[axis]) return;

          const newSelectedAxis: ChartEncodes = {
            ...selectedAxis,
            [axis]: (selectedAxis[axis] as string[]).filter((x) => x !== id)
          };

          if (chartTypeToAxis[selectedChartType]) {
            onUpdateMetricChartConfig({
              chartConfig: {
                [chartTypeToAxis[selectedChartType]]: newSelectedAxis
              }
            });
          }
        }
      });

      return (
        <div
          data-testid={`select-axis-drop-zone-${id}`}
          className={`transition-opacity duration-200 ${isPlaceholder ? 'opacity-0' : 'opacity-100'}`}>
          <CollapseDelete
            ref={ref}
            draggingProps={draggingProps}
            title={<SelectAxisItemLabel id={id} columnLabelFormat={columnLabelFormat} />}
            onDelete={onDelete}>
            <DropdownContent id={id} zoneId={zoneId} />
          </CollapseDelete>
        </div>
      );
    }
  )
);
SelectAxisItemContainer.displayName = 'SelectAxisItemContainer';

const DropdownContent: React.FC<{ id: string; zoneId: SelectAxisContainerId }> = ({
  id,
  zoneId
}) => {
  const columnLabelFormat = useSelectAxisContextSelector((x) => x.columnLabelFormats[id]);
  const columnSetting = useSelectAxisContextSelector((x) => x.columnSettings[id]);
  const selectedChartType = useSelectAxisContextSelector((x) => x.selectedChartType);
  const barGroupType = useSelectAxisContextSelector((x) => x.barGroupType);
  const lineGroupType = useSelectAxisContextSelector((x) => x.lineGroupType);
  const selectedAxis = useSelectAxisContextSelector((x) => x.selectedAxis);
  const rowCount = useSelectAxisContextSelector((x) => x.rowCount);

  const memoizedErrorComponent = useMemo(() => {
    return (
      <div className="bg-danger-background flex min-h-24 items-center justify-center rounded-b border border-red-500">
        <span className="text-danger-foreground p-3 text-center">
          There was an error loading the chart config. Please contact Buster support.
        </span>
      </div>
    );
  }, []);

  return (
    <ErrorBoundary errorComponent={memoizedErrorComponent}>
      <SelectAxisDropdownContent
        hideTitle
        id={id}
        zoneId={zoneId}
        columnLabelFormat={columnLabelFormat}
        columnSetting={columnSetting}
        selectedChartType={selectedChartType}
        barGroupType={barGroupType}
        lineGroupType={lineGroupType}
        selectedAxis={selectedAxis}
        rowCount={rowCount}
      />
    </ErrorBoundary>
  );
};
