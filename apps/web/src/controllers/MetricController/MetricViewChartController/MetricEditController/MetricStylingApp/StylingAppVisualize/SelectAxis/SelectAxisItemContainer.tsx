import type { ChartEncodes, ColumnLabelFormat } from '@buster/server-shared/metrics';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import React, { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorCard } from '@/components/ui/error/ErrorCard';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import { CollapseDelete } from '../../Common/CollapseDelete';
import { chartTypeToAxis, type SelectAxisContainerId, zoneIdToAxis } from './config';
import { SelectAxisDropdownContent } from './SelectAxisColumnContent';
import { SelectAxisItemLabel } from './SelectAxisItemLabel';
import {
  useAxisContextBarGroupType,
  useAxisContextColumnLabelFormat,
  useAxisContextColumnSetting,
  useAxisContextLineGroupType,
  useAxisContextMetricId,
  useAxisContextRowCount,
  useAxisContextSelectedAxis,
  useAxisContextSelectedChartType,
} from './useSelectAxisContext';

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
      const columnLabelFormat: undefined | ColumnLabelFormat = useAxisContextColumnLabelFormat(id);
      const selectedAxis = useAxisContextSelectedAxis();
      const selectedChartType = useAxisContextSelectedChartType();
      const metricId = useAxisContextMetricId();
      const { onUpdateMetricChartConfig } = useUpdateMetricChart({ metricId });

      const onDelete = () => {
        if (selectedAxis && selectedChartType) {
          const axis = zoneIdToAxis[zoneId] as keyof ChartEncodes;
          if (!axis || !selectedAxis[axis]) return;

          const newSelectedAxis: ChartEncodes = {
            ...selectedAxis,
            [axis]: (selectedAxis[axis] as string[]).filter((x) => x !== id),
          };

          if (chartTypeToAxis[selectedChartType]) {
            onUpdateMetricChartConfig({
              chartConfig: {
                [chartTypeToAxis[selectedChartType]]: newSelectedAxis,
              },
            });
          }
        }
      };

      return (
        <div
          data-testid={`select-axis-drop-zone-${id}`}
          className={`transition-opacity duration-200 ${isPlaceholder ? 'opacity-0' : 'opacity-100'}`}
        >
          <CollapseDelete
            ref={ref}
            draggingProps={draggingProps}
            title={<SelectAxisItemLabel id={id} columnLabelFormat={columnLabelFormat} />}
            onDelete={onDelete}
          >
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
  zoneId,
}) => {
  const columnLabelFormat = useAxisContextColumnLabelFormat(id);
  const columnSetting = useAxisContextColumnSetting(id);
  const selectedChartType = useAxisContextSelectedChartType();
  const barGroupType = useAxisContextBarGroupType();
  const lineGroupType = useAxisContextLineGroupType();
  const rowCount = useAxisContextRowCount();

  const memoizedErrorComponent = useMemo(() => {
    return (
      <ErrorCard message="There was an error loading the chart config. Please contact Buster support." />
    );
  }, []);

  return (
    <ErrorBoundary fallback={memoizedErrorComponent}>
      <SelectAxisDropdownContent
        hideTitle
        id={id}
        zoneId={zoneId}
        columnLabelFormat={columnLabelFormat}
        columnSetting={columnSetting}
        selectedChartType={selectedChartType}
        barGroupType={barGroupType}
        lineGroupType={lineGroupType}
        rowCount={rowCount}
      />
    </ErrorBoundary>
  );
};
