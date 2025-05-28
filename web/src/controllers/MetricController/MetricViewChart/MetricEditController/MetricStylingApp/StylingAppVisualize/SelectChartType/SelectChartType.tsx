import React, { useMemo } from 'react';
import type { ChartEncodes, ChartType } from '@/api/asset_interfaces/metric/charts';
import type { ColumnMetaData, IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { AppTooltip } from '@/components/ui/tooltip';
import { CHART_ICON_LIST, ChartIconType, DETERMINE_SELECTED_CHART_TYPE_ORDER } from './config';
import {
  selectedChartTypeMethod,
  DetermineSelectedChartType,
  disableTypeMethod
} from './SelectedChartTypeMethod';
import { useMemoizedFn, useUnmount } from '@/hooks';
import { addOpacityToColor, NUMBER_TYPES } from '@/lib';
import { cn } from '@/lib/classMerge';
import { useUpdateMetricChart } from '@/context/Metrics';

export interface SelectChartTypeProps {
  selectedChartType: ChartType;
  lineGroupType: IBusterMetricChartConfig['lineGroupType'];
  barGroupType: IBusterMetricChartConfig['barGroupType'];
  barLayout: IBusterMetricChartConfig['barLayout'];
  colors: string[];
  columnMetadata: ColumnMetaData[];
  columnSettings: IBusterMetricChartConfig['columnSettings'];
  selectedAxis: ChartEncodes;
}

export const SelectChartType: React.FC<SelectChartTypeProps> = ({
  selectedChartType,
  barLayout,
  lineGroupType,
  barGroupType,
  colors,
  columnMetadata,
  columnSettings,
  selectedAxis
}) => {
  const { onUpdateMetricChartConfig } = useUpdateMetricChart();
  const hasAreaStyle = useMemo(() => {
    if (selectedChartType !== 'line') return false;
    return selectedAxis.y.some((y) => columnSettings[y]?.lineStyle === 'area');
  }, [selectedChartType, selectedAxis, columnSettings]);

  const selectedChartTypeIcon: ChartIconType = useMemo(() => {
    return (
      DETERMINE_SELECTED_CHART_TYPE_ORDER.find((id) =>
        DetermineSelectedChartType[id]({
          selectedChartType,
          lineGroupType,
          barGroupType,
          barLayout,
          hasAreaStyle
        })
      ) || ChartIconType.TABLE
    );
  }, [hasAreaStyle, selectedChartType, barLayout, barGroupType, lineGroupType]);

  const onSelectChartType = useMemoizedFn((chartIconType: ChartIconType) => {
    const chartConfig = selectedChartTypeMethod(chartIconType, columnSettings);
    onUpdateMetricChartConfig({ chartConfig });
  });

  return (
    <SelectedChartTypeContainer
      selectedChartTypeIcon={selectedChartTypeIcon}
      onSelectChartType={onSelectChartType}
      colors={colors}
      columnMetadata={columnMetadata}
    />
  );
};
SelectChartType.displayName = 'SelectChartType';

const SelectedChartTypeContainer: React.FC<{
  selectedChartTypeIcon: ChartIconType;
  onSelectChartType: (chartIconType: ChartIconType) => void;
  colors: string[];
  columnMetadata: ColumnMetaData[];
}> = React.memo(({ selectedChartTypeIcon, onSelectChartType, colors, columnMetadata }) => {
  const disabledButtons: Record<ChartIconType, boolean> = useMemo(() => {
    const hasNumericColumn = columnMetadata.some((column) => NUMBER_TYPES.includes(column.type));
    const hasMultipleColumns = columnMetadata.length > 1;
    const hasColumns = columnMetadata.length > 0;
    const hasMultipleNumericColumns =
      columnMetadata.filter((column) => NUMBER_TYPES.includes(column.type))?.length > 1;

    return CHART_ICON_LIST.reduce(
      (acc, curr) => {
        acc[curr.id] = disableTypeMethod[curr.id]({
          hasNumericColumn,
          hasMultipleColumns,
          hasColumns,
          hasMultipleNumericColumns
        });
        return acc;
      },
      {} as Record<ChartIconType, boolean>
    );
  }, [columnMetadata]);

  const colorsWithOpacity = useMemo(() => {
    const _firstColor = colors[0];
    const _secondColor = colors[1];
    const _thirdColor = colors[2];
    const areFirstThreeColorsTheSame = _firstColor === _secondColor && _secondColor === _thirdColor;
    const opacities: [number, number, number] = areFirstThreeColorsTheSame
      ? [1, 0.65, 0.4]
      : [1, 1, 1];
    return opacities.map((opacity, index) => addOpacityToColor(colors[index], opacity));
  }, [colors]);

  return (
    <div
      className={cn('bg-item-active border-border/40 rounded border', 'grid w-full gap-1 p-1')}
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(50px, 70px), 1fr))' }}>
      {CHART_ICON_LIST.map(({ id, icon: Icon, tooltipText }) => (
        <ChartButton
          key={id}
          id={id}
          icon={Icon}
          tooltipText={tooltipText}
          isSelected={selectedChartTypeIcon === id}
          onSelectChartType={onSelectChartType}
          disabled={disabledButtons[id]}
          colors={colorsWithOpacity}
        />
      ))}
    </div>
  );
});
SelectedChartTypeContainer.displayName = 'SelectedChartTypeContainer';

const ChartButton: React.FC<{
  id: ChartIconType;
  icon: React.FC<{ colors?: string[]; disabled?: boolean }>;
  tooltipText: string;
  onSelectChartType: (chartIconType: ChartIconType) => void;
  isSelected: boolean;
  disabled?: boolean;
  colors?: string[];
}> = React.memo(
  ({ id, icon: Icon, tooltipText, onSelectChartType, isSelected, disabled, colors }) => {
    return (
      <AppTooltip title={tooltipText} delayDuration={650}>
        <button
          key={id}
          disabled={disabled}
          data-testid={`select-chart-type-${id}`}
          onClick={() => !disabled && onSelectChartType(id)}
          data-state={isSelected ? 'selected' : 'not-selected'}
          className={cn(
            'flex aspect-square h-[35px] w-full items-center justify-center hover:transition-none',
            'hover:bg-item-hover cursor-pointer rounded',
            isSelected && 'bg-background hover:bg-background border',
            disabled && 'cursor-not-allowed! bg-transparent!'
          )}>
          <Icon colors={colors} disabled={disabled} />
        </button>
      </AppTooltip>
    );
  }
);
ChartButton.displayName = 'ChartButton';
