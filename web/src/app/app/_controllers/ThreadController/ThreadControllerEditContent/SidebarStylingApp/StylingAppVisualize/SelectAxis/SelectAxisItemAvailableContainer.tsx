import React from 'react';
import { DraggableAttributes } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { SelectAxisItemDragContainer } from './SelectAxisDragContainer';
import { useSelectAxisContextSelector } from './useSelectAxisContext';
import { SelectAxisItemLabel } from './SelectAxisItemLabel';
import { AppMaterialIcons } from '@/components/icons';
import { Button } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { SelectAxisColumnPopover } from './SelectAxisColumnPopover';
import { ChartEncodes, IColumnLabelFormat } from '@/components/charts';
import { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import { SelectAxisContainerId } from './config';

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
          />
        </div>
      </SelectAxisItemDragContainer>
    );
  })
);

const ThreeDotMenu: React.FC<{
  isDragging?: boolean;
  columnLabelFormat: IColumnLabelFormat;
  columnSetting: IBusterThreadMessageChartConfig['columnSettings'][string];
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  barGroupType: IBusterThreadMessageChartConfig['barGroupType'];
  lineGroupType: IBusterThreadMessageChartConfig['lineGroupType'];
  zoneId: SelectAxisContainerId;
  selectedAxis: ChartEncodes | null;
  id: string;
}> = (props) => {
  const onClickButton = useMemoizedFn(
    (e: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
    }
  );

  const ButtonNode = <Button type="text" icon={<AppMaterialIcons icon="more_vert" />} />;
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
