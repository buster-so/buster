import type { IBusterThreadMessageChartConfig } from '@/api/buster_rest/threads/threadConfigInterfaces';
import type { IColumnLabelFormat } from '@/components/charts/interfaces/columnLabelInterfaces';
import { useMemoizedFn } from 'ahooks';
import React, { useMemo } from 'react';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { formatLabel } from '@/utils';
import { EditTitle } from './EditTitle';
import { EditDisplayAs } from './EditDisplayAs';
import { BarAndLineAxis, ChartEncodes, ChartType, ColumnSettings } from '@/components/charts';
import { EditBarRoundness } from './EditBarRoundness';
import { EditShowDataLabel } from './EditShowDataLabel';
import { EditShowBarLabelAsPercentage } from './EditShowLabelAsPercentage';
import { Divider } from 'antd';
import { EditLabelStyle } from './EditLabelStyle';
import { EditSeparator } from './EditSeparator';
import { EditDecimals } from './EditDecimals';
import { EditMultiplyBy } from './EditMultiplyBy';
import { EditPrefix } from './EditPrefix';
import { EditSuffix } from './EditSuffix';
import { EditCurrency } from './EditCurrency';
import { EditDateType } from './EditDateType';
import { EditDateFormat } from './EditDateFormat';
import { Text } from '@/components/text';
import { SelectAxisContainerId } from '../config';
import { EditReplaceMissingData } from './EditReplaceMissingData';
import { EditLineStyle } from './EditLineStyle';
import isEmpty from 'lodash/isEmpty';
import { useGetCurrencies } from '@/api/buster_rest/nextjs/currency';

export const SelectAxisDropdownContent: React.FC<{
  columnSetting: IBusterThreadMessageChartConfig['columnSettings'][string];
  columnLabelFormat: IColumnLabelFormat;
  selectedAxis: ChartEncodes | null;
  id: string;
  className?: string;
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  barGroupType: IBusterThreadMessageChartConfig['barGroupType'];
  lineGroupType: IBusterThreadMessageChartConfig['lineGroupType'];
  zoneId: SelectAxisContainerId;
  hideTitle?: boolean;
  classNames?: {
    title?: string;
    columnSetting?: string;
    labelSettings?: string;
  };
}> = ({
  columnLabelFormat,
  columnSetting,
  id,
  zoneId,
  className = '',
  selectedChartType,
  barGroupType,
  lineGroupType,
  selectedAxis,
  hideTitle = false,
  classNames
}) => {
  const onUpdateColumnLabelFormat = useBusterThreadsContextSelector(
    ({ onUpdateColumnLabelFormat }) => onUpdateColumnLabelFormat
  );
  const onUpdateColumnSetting = useBusterThreadsContextSelector(
    ({ onUpdateColumnSetting }) => onUpdateColumnSetting
  );
  const onUpdateMessageChartConfig = useBusterThreadsContextSelector(
    ({ onUpdateMessageChartConfig }) => onUpdateMessageChartConfig
  );

  const { displayName } = columnLabelFormat;
  const formattedTitle = useMemo(() => {
    return formatLabel(id, columnLabelFormat, true);
  }, [displayName]);

  const onUpdateColumnConfig = useMemoizedFn((columnLabelFormat: Partial<IColumnLabelFormat>) => {
    onUpdateColumnLabelFormat({
      columnLabelFormat,
      columnId: id
    });
  });

  const onUpdateColumnSettingConfig = useMemoizedFn((columnSetting: Partial<ColumnSettings>) => {
    onUpdateColumnSetting({
      columnSetting,
      columnId: id
    });
  });

  const onUpdateChartConfig = useMemoizedFn(
    (chartConfig: Partial<IBusterThreadMessageChartConfig>) => {
      onUpdateMessageChartConfig({
        chartConfig
      });
    }
  );

  return (
    <div className={`${className}`}>
      {!hideTitle && <TitleComponent formattedTitle={formattedTitle} />}

      <ColumnSettingComponent
        className={classNames?.columnSetting}
        formattedTitle={formattedTitle}
        columnSetting={columnSetting}
        columnLabelFormat={columnLabelFormat}
        selectedAxis={selectedAxis}
        onUpdateColumnConfig={onUpdateColumnConfig}
        onUpdateColumnSettingConfig={onUpdateColumnSettingConfig}
        selectedChartType={selectedChartType}
        lineGroupType={lineGroupType}
        barGroupType={barGroupType}
        zoneId={zoneId}
      />

      <LabelSettings
        className={classNames?.labelSettings}
        columnLabelFormat={columnLabelFormat}
        onUpdateColumnConfig={onUpdateColumnConfig}
        id={id}
        selectedChartType={selectedChartType}
        zoneId={zoneId}
      />
    </div>
  );
};

const ColumnSettingComponent: React.FC<{
  className?: string;
  formattedTitle: string;
  onUpdateColumnConfig: (columnLabelFormat: Partial<IColumnLabelFormat>) => void;
  onUpdateColumnSettingConfig: (columnSetting: Partial<ColumnSettings>) => void;
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  selectedAxis: ChartEncodes | null;
  columnSetting: IBusterThreadMessageChartConfig['columnSettings'][string];
  columnLabelFormat: IColumnLabelFormat;
  zoneId: SelectAxisContainerId;
  lineGroupType: IBusterThreadMessageChartConfig['lineGroupType'];
  barGroupType: IBusterThreadMessageChartConfig['barGroupType'];
}> = ({
  formattedTitle,
  columnSetting,
  columnLabelFormat,
  selectedAxis,
  onUpdateColumnConfig,
  onUpdateColumnSettingConfig,
  selectedChartType,
  zoneId,
  className = '',
  lineGroupType,
  barGroupType
}) => {
  const {
    lineStyle,
    lineType,
    lineSymbolSize,
    columnVisualization,
    barRoundness,
    showDataLabels,
    showDataLabelsAsPercentage
  } = columnSetting;
  const { displayName } = columnLabelFormat;
  const isBarChart = selectedChartType === ChartType.Bar;
  const isLineChart = selectedChartType === ChartType.Line;
  const isScatterChart = selectedChartType === ChartType.Scatter;
  const isComboChart = selectedChartType === ChartType.Combo;
  const isPieChart = selectedChartType === ChartType.Pie;
  const isMetricChart = selectedChartType === ChartType.Metric;
  const isYAxisZone =
    zoneId === SelectAxisContainerId.YAxis || zoneId === SelectAxisContainerId.Y2Axis;
  const isAvailableZone = zoneId === SelectAxisContainerId.Available;
  const isCategoryAxis = zoneId === SelectAxisContainerId.CategoryAxis;
  const isXAxisZone = zoneId === SelectAxisContainerId.XAxis;
  const isSizeZone = zoneId === SelectAxisContainerId.SizeAxis;
  const isBarVisualization = columnVisualization === 'bar';
  const isLineVisualization = columnVisualization === 'line';
  const isTablePieChart = selectedChartType === ChartType.Table || isPieChart;
  const isTableMetricPieChart = isTablePieChart || isMetricChart;
  const hasCategoryAxis = !isEmpty((selectedAxis as BarAndLineAxis)?.category);
  const hasMultipleMeasures = (selectedAxis?.y.length || 0) > 1;
  const isPercentStacked = useMemo(() => {
    if (selectedChartType === ChartType.Bar) {
      return barGroupType === 'percentage-stack';
    }
    if (selectedChartType === ChartType.Line) {
      return lineGroupType === 'percentage-stack';
    }
    return false;
  }, [barGroupType, lineGroupType, selectedChartType]);

  const ComponentsLoop = [
    {
      enabled: !isXAxisZone && !isTablePieChart && !isSizeZone && !isScatterChart,
      key: 'title',
      Component: (
        <EditTitle
          displayName={displayName}
          formattedTitle={formattedTitle}
          onUpdateColumnConfig={onUpdateColumnConfig}
        />
      )
    },
    {
      enabled: isComboChart && (isYAxisZone || isAvailableZone),
      key: 'displayAs',
      Component: (
        <EditDisplayAs
          columnVisualization={columnVisualization}
          onUpdateColumnSettingConfig={onUpdateColumnSettingConfig}
          selectedChartType={selectedChartType}
        />
      )
    },
    {
      enabled: (isLineChart || (isLineVisualization && isComboChart)) && !isCategoryAxis,
      key: 'lineStyle',
      Component: (
        <EditLineStyle
          lineStyle={lineStyle}
          lineType={lineType}
          selectedChartType={selectedChartType}
          lineSymbolSize={lineSymbolSize}
          onUpdateColumnSettingConfig={onUpdateColumnSettingConfig}
        />
      )
    },
    {
      enabled:
        (isBarChart || (isComboChart && isBarVisualization)) && (isYAxisZone || isAvailableZone),
      key: 'barRoundness',
      Component: (
        <EditBarRoundness
          barRoundness={barRoundness}
          onUpdateColumnSettingConfig={onUpdateColumnSettingConfig}
        />
      )
    },
    {
      enabled:
        !isTableMetricPieChart &&
        (isYAxisZone || isAvailableZone) &&
        !isPieChart &&
        !isScatterChart,
      key: 'showDataLabels',
      Component: (
        <EditShowDataLabel
          showDataLabels={showDataLabels}
          onUpdateColumnSettingConfig={onUpdateColumnSettingConfig}
        />
      )
    },
    {
      enabled:
        showDataLabels && (isYAxisZone || isAvailableZone) && isBarChart && !isPercentStacked,
      key: 'asLabelPercentage',
      Component: (
        <EditShowBarLabelAsPercentage
          onUpdateColumnSettingConfig={onUpdateColumnSettingConfig}
          showDataLabelsAsPercentage={showDataLabelsAsPercentage}
        />
      )
    }
  ];

  const EnabledComponentsLoop = ComponentsLoop.filter(({ enabled }) => enabled);

  if (EnabledComponentsLoop.length === 0) return null;

  return (
    <>
      <div className={`${className} flex w-full flex-col space-y-3 overflow-hidden p-3`}>
        {EnabledComponentsLoop.map(({ enabled, key, Component }) => {
          return <React.Fragment key={key}>{Component}</React.Fragment>;
        })}
      </div>

      {<Divider />}
    </>
  );
};

const LabelSettings: React.FC<{
  className?: string;
  columnLabelFormat: IColumnLabelFormat;
  onUpdateColumnConfig: (columnLabelFormat: Partial<IColumnLabelFormat>) => void;
  id: string;
  zoneId: SelectAxisContainerId;
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
}> = ({
  columnLabelFormat,
  onUpdateColumnConfig,
  id,
  zoneId,
  className = '',
  selectedChartType
}) => {
  const {
    style,
    multiplier,
    numberSeparatorStyle,
    minimumFractionDigits,
    maximumFractionDigits,
    prefix,
    suffix,
    currency,
    convertNumberTo,
    dateFormat,
    columnType,
    displayName,
    replaceMissingDataWith
  } = columnLabelFormat;

  const isPieChart = selectedChartType === ChartType.Pie;
  const isScatterChart = selectedChartType === ChartType.Scatter;
  const isMetricChart = selectedChartType === ChartType.Metric;
  const isPercentage = style === 'percent';
  const isCurrency = style === 'currency';
  const isDate = style === 'date';
  const isNumber = style === 'number';
  const isAvailable = zoneId === SelectAxisContainerId.Available;
  const isYAxis = zoneId === SelectAxisContainerId.YAxis;
  const isXAxis = zoneId === SelectAxisContainerId.XAxis;
  const isAvailableOrYAxis = isAvailable || isYAxis;

  const formattedTitle = useMemo(() => {
    return formatLabel(id, columnLabelFormat, true);
  }, [displayName]);

  //THIS IS HERE JUST TO PREFETCH THE CURRENCIES
  useGetCurrencies({ enabled: true });

  const ComponentsLoop = [
    {
      enabled: isXAxis || isScatterChart,
      key: 'title',
      Component: (
        <EditTitle
          displayName={displayName}
          formattedTitle={formattedTitle}
          onUpdateColumnConfig={onUpdateColumnConfig}
        />
      )
    },
    {
      enabled: true,
      key: 'labelStyle',
      Component: (
        <EditLabelStyle
          style={style}
          columnType={columnType}
          onUpdateColumnConfig={onUpdateColumnConfig}
          convertNumberTo={convertNumberTo}
        />
      )
    },
    {
      enabled: isCurrency,
      key: 'currency',
      Component: <EditCurrency currency={currency} onUpdateColumnConfig={onUpdateColumnConfig} />
    },
    {
      enabled: isNumber || isPercentage,
      key: 'separator',
      Component: (
        <EditSeparator
          numberSeparatorStyle={numberSeparatorStyle}
          onUpdateColumnConfig={onUpdateColumnConfig}
        />
      )
    },
    {
      enabled: isNumber || isPercentage,
      key: 'decimals',
      Component: (
        <EditDecimals
          minimumFractionDigits={minimumFractionDigits}
          maximumFractionDigits={maximumFractionDigits}
          onUpdateColumnConfig={onUpdateColumnConfig}
        />
      )
    },
    {
      enabled: isNumber || isPercentage || isCurrency,
      key: 'multiply',
      Component: (
        <EditMultiplyBy multiplier={multiplier} onUpdateColumnConfig={onUpdateColumnConfig} />
      )
    },

    {
      enabled: isDate && convertNumberTo,
      key: 'dateType',
      Component: (
        <EditDateType
          convertNumberTo={convertNumberTo}
          onUpdateColumnConfig={onUpdateColumnConfig}
        />
      )
    },
    {
      enabled: isDate,
      key: 'dateFormat',
      Component: (
        <EditDateFormat
          dateFormat={dateFormat}
          convertNumberTo={convertNumberTo}
          columnType={columnType}
          onUpdateColumnConfig={onUpdateColumnConfig}
        />
      )
    },
    {
      enabled: !isDate && !isCurrency,
      key: 'prefix',
      Component: <EditPrefix prefix={prefix} onUpdateColumnConfig={onUpdateColumnConfig} />
    },
    {
      enabled: !isDate && !isCurrency,
      key: 'suffix',
      Component: <EditSuffix suffix={suffix} onUpdateColumnConfig={onUpdateColumnConfig} />
    },
    {
      enabled:
        (isCurrency || isNumber || isPercentage) &&
        isAvailableOrYAxis &&
        !isPieChart &&
        !isScatterChart &&
        !isMetricChart,
      key: 'replaceMissingData',
      Component: (
        <EditReplaceMissingData
          replaceMissingDataWith={replaceMissingDataWith}
          onUpdateColumnConfig={onUpdateColumnConfig}
        />
      )
    }
  ].filter(({ enabled }) => enabled);

  if (ComponentsLoop.length === 0) return null;

  return (
    <div className={`${className} flex w-full flex-col space-y-3 overflow-hidden p-3`}>
      {ComponentsLoop.map(({ key, Component }) => {
        return <React.Fragment key={key}>{Component}</React.Fragment>;
      })}
    </div>
  );
};

const TitleComponent: React.FC<{
  formattedTitle: string;
  className?: string;
}> = React.memo(({ formattedTitle, className = '' }) => {
  return (
    <div className={`${className} flex flex-col`}>
      <div className="px-3 py-2.5">
        <Text className="break-words">{formattedTitle}</Text>
      </div>
      <Divider />
    </div>
  );
});
TitleComponent.displayName = 'TitleComponent';
