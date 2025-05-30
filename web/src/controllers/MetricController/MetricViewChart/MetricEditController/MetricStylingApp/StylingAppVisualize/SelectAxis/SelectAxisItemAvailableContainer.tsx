import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import React from 'react';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import type { ChartEncodes, IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { Button } from '@/components/ui/buttons';
import { DotsVertical } from '@/components/ui/icons';
import { useMemoizedFn } from '@/hooks';
import type { SelectAxisContainerId } from './config';
import { SelectAxisColumnPopover } from './SelectAxisColumnPopover';
import { SelectAxisItemDragContainer } from './SelectAxisDragContainer';
import { SelectAxisItemLabel } from './SelectAxisItemLabel';
import { useSelectAxisContextSelector } from './useSelectAxisContext';

export const SelectAxisItemAvailableContainer = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      id: string;
      zoneId: SelectAxisContainerId;
      style?: React.CSSProperties;
      className?: string;
      isDragging?: boolean;
      listeners?: SyntheticListenerMap;
      attributes?: DraggableAttributes;
    }
  >(({ id, zoneId, ...props }, ref) => {
    const { isDragging } = props;
    const columnLabelFormat = useSelectAxisContextSelector((x) => x.columnLabelFormats[id]);
    const columnSetting = useSelectAxisContextSelector((x) => x.columnSettings[id]);
    const selectedChartType = useSelectAxisContextSelector((x) => x.selectedChartType);
    const barGroupType = useSelectAxisContextSelector((x) => x.barGroupType);
    const lineGroupType = useSelectAxisContextSelector((x) => x.lineGroupType);
    const selectedAxis = useSelectAxisContextSelector((x) => x.selectedAxis);
    const rowCount = useSelectAxisContextSelector((x) => x.rowCount);

    return (
      <SelectAxisItemDragContainer {...props} ref={ref}>
        <div className="flex w-full items-center justify-between space-x-2 overflow-hidden pr-1">
          <SelectAxisItemLabel id={id} columnLabelFormat={columnLabelFormat} />
          <ThreeDotMenu
            isDragging={isDragging}
            columnLabelFormat={columnLabelFormat}
            columnSetting={columnSetting}
            selectedChartType={selectedChartType}
            barGroupType={barGroupType}
            lineGroupType={lineGroupType}
            id={id}
            zoneId={zoneId}
            selectedAxis={selectedAxis}
            rowCount={rowCount}
          />
        </div>
      </SelectAxisItemDragContainer>
    );
  })
);

const ThreeDotMenu: React.FC<{
  isDragging?: boolean;
  columnLabelFormat: IColumnLabelFormat;
  columnSetting: IBusterMetricChartConfig['columnSettings'][string];
  selectedChartType: IBusterMetricChartConfig['selectedChartType'];
  barGroupType: IBusterMetricChartConfig['barGroupType'];
  lineGroupType: IBusterMetricChartConfig['lineGroupType'];
  zoneId: SelectAxisContainerId;
  selectedAxis: ChartEncodes | null;
  id: string;
  rowCount: number;
}> = (props) => {
  const onClickButton = useMemoizedFn(
    (e: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
    }
  );

  const ButtonNode = <Button variant="ghost" prefix={<DotsVertical />} />;
  const { isDragging } = props;

  if (isDragging) {
    return ButtonNode;
  }

  return (
    <div onClick={onClickButton} className="flex">
      <SelectAxisColumnPopover {...props}>{ButtonNode}</SelectAxisColumnPopover>
    </div>
  );
};

SelectAxisItemAvailableContainer.displayName = 'SelectAxisItemAvailableContainer';
