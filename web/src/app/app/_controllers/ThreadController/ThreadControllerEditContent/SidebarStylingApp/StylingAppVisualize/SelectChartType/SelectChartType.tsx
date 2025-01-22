import React, { useMemo } from 'react';
import { createStyles } from 'antd-style';
import { ChartEncodes, ChartType, ViewType } from '@/components/charts';
import { IBusterThreadMessageChartConfig } from '@/api/buster_rest/threads/threadConfigInterfaces';
import { AppTooltip } from '@/components';
import { CHART_ICON_LIST, ChartIconType, DETERMINE_SELECTED_CHART_TYPE_ORDER } from './config';
import {
  selectedChartTypeMethod,
  DetermineSelectedChartType,
  disableTypeMethod
} from './SelectedChartTypeMethod';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { useMemoizedFn } from 'ahooks';
import { ColumnMetaData } from '@/api/buster_rest';
import { addOpacityToColor, NUMBER_TYPES } from '@/utils';

export interface SelectChartTypeProps {
  selectedChartType: ChartType;
  selectedView: ViewType;
  lineGroupType: IBusterThreadMessageChartConfig['lineGroupType'];
  barGroupType: IBusterThreadMessageChartConfig['barGroupType'];
  barLayout: IBusterThreadMessageChartConfig['barLayout'];
  colors: string[];
  columnMetadata: ColumnMetaData[];
  columnSettings: IBusterThreadMessageChartConfig['columnSettings'];
  selectedAxis: ChartEncodes;
}

export const SelectChartType: React.FC<SelectChartTypeProps> = ({
  selectedChartType,
  barLayout,
  lineGroupType,
  barGroupType,
  selectedView,
  colors,
  columnMetadata,
  columnSettings,
  selectedAxis
}) => {
  const onUpdateMessageChartConfig = useBusterThreadsContextSelector(
    ({ onUpdateMessageChartConfig }) => onUpdateMessageChartConfig
  );

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
          selectedView,
          hasAreaStyle
        })
      ) || ChartIconType.TABLE
    );
  }, [selectedView, hasAreaStyle, selectedChartType, barLayout, barGroupType, lineGroupType]);

  const onSelectChartType = useMemoizedFn((chartIconType: ChartIconType) => {
    const chartConfig = selectedChartTypeMethod(chartIconType, columnSettings);
    onUpdateMessageChartConfig({ chartConfig });
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
  const { styles, cx } = useStyles();

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
      className={cx(styles.container, 'grid w-full gap-1 p-1')}
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
    const { styles, cx } = useStyles();

    return (
      <AppTooltip title={tooltipText} performant mouseEnterDelay={0.75}>
        <div
          key={id}
          onClick={() => !disabled && onSelectChartType(id)}
          className={cx(
            'flex aspect-square h-[35px] w-full items-center justify-center',
            styles.containerItem,
            isSelected && 'selected',
            disabled && '!cursor-not-allowed'
          )}>
          <Icon colors={colors} disabled={disabled} />
        </div>
      </AppTooltip>
    );
  }
);
ChartButton.displayName = 'ChartButton';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    border: 0.5px solid rgba(0, 0, 0, 0.1);
    background: ${token.controlItemBgActive};
    border-radius: ${token.borderRadius}px;
  `,
  containerItem: css`
    border-radius: ${token.borderRadius}px;
    cursor: pointer;

    &:hover {
      background: ${token.colorBgContainer};
      transition: all 0s;
    }

    &.selected {
      background: ${token.colorBgContainer};
      border: 0.5px solid ${token.colorBorder};

      &:hover {
        background: ${token.colorBgContainer};
      }
    }

    &.disabled {
      &:hover {
        background: transparent;
      }
    }
  `
}));
