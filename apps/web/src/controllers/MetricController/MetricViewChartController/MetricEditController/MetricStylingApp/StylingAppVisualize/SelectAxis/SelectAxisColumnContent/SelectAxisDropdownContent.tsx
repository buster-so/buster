import type {
  ChartConfigProps,
  ColumnLabelFormat,
  ColumnSettings,
} from '@buster/server-shared/metrics';
import React, { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useGetCurrencies } from '@/api/buster_rest/dictionaries';
import { Text } from '@/components/ui/typography';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/classMerge';
import { formatLabel } from '@/lib/columnFormatter';
import { SelectAxisContainerId } from '../config';
import { useAxisContextMetricId } from '../useSelectAxisContext';
import { EditBarRoundness } from './EditBarRoundness';
import { EditCompactNumbers } from './EditCompactNumbers';
import { EditCurrency } from './EditCurrency';
import { EditDateFormat } from './EditDateFormat';
import { EditDateType } from './EditDateType';
import { EditDecimals } from './EditDecimals';
import { EditDisplayAs } from './EditDisplayAs';
import { EditLabelStyle } from './EditLabelStyle';
import { EditLineStyle } from './EditLineStyle';
import { EditMultiplyBy } from './EditMultiplyBy';
import { EditPrefix } from './EditPrefix';
import { EditReplaceMissingData } from './EditReplaceMissingData';
import { EditSeparator } from './EditSeparator';
import { EditShowDataLabel } from './EditShowDataLabel';
import { EditShowBarLabelAsPercentage } from './EditShowLabelAsPercentage';
import { EditSuffix } from './EditSuffix';
import { EditTitle } from './EditTitle';

export const SelectAxisDropdownContent: React.FC<{
  columnSetting: ChartConfigProps['columnSettings'][string];
  columnLabelFormat: ColumnLabelFormat;
  id: string;
  className?: string;
  selectedChartType: ChartConfigProps['selectedChartType'];
  barGroupType: ChartConfigProps['barGroupType'];
  lineGroupType: ChartConfigProps['lineGroupType'];
  zoneId: SelectAxisContainerId;
  hideTitle?: boolean;
  classNames?: {
    title?: string;
    columnSetting?: string;
    labelSettings?: string;
  };
  rowCount: number;
}> = ({
  columnLabelFormat,
  columnSetting,
  id,
  zoneId,
  rowCount,
  className = '',
  selectedChartType,
  barGroupType,
  lineGroupType,
  hideTitle = false,
  classNames,
}) => {
  const metricId = useAxisContextMetricId();
  const { onUpdateColumnLabelFormat, onUpdateColumnSetting } = useUpdateMetricChart({ metricId });

  const { displayName } = columnLabelFormat;
  const formattedTitle = useMemo(() => {
    return formatLabel(id, columnLabelFormat, true);
  }, [displayName]);

  const onUpdateColumnConfig = useMemoizedFn((columnLabelFormat: Partial<ColumnLabelFormat>) => {
    onUpdateColumnLabelFormat({
      columnLabelFormat,
      columnId: id,
    });
  });

  const onUpdateColumnSettingConfig = useMemoizedFn((columnSetting: Partial<ColumnSettings>) => {
    onUpdateColumnSetting({
      columnSetting,
      columnId: id,
    });
  });

  return (
    <div className={cn(className)}>
      {!hideTitle && <TitleComponent formattedTitle={formattedTitle} />}

      <ColumnSettingComponent
        className={classNames?.columnSetting}
        formattedTitle={formattedTitle}
        columnSetting={columnSetting}
        columnLabelFormat={columnLabelFormat}
        onUpdateColumnConfig={onUpdateColumnConfig}
        onUpdateColumnSettingConfig={onUpdateColumnSettingConfig}
        selectedChartType={selectedChartType}
        lineGroupType={lineGroupType}
        barGroupType={barGroupType}
        zoneId={zoneId}
        rowCount={rowCount}
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
  onUpdateColumnConfig: (columnLabelFormat: Partial<ColumnLabelFormat>) => void;
  onUpdateColumnSettingConfig: (columnSetting: Partial<ColumnSettings>) => void;
  selectedChartType: ChartConfigProps['selectedChartType'];
  columnSetting: ChartConfigProps['columnSettings'][string];
  columnLabelFormat: ColumnLabelFormat;
  zoneId: SelectAxisContainerId;
  lineGroupType: ChartConfigProps['lineGroupType'];
  barGroupType: ChartConfigProps['barGroupType'];
  rowCount: number;
}> = ({
  formattedTitle,
  columnSetting,
  columnLabelFormat,
  onUpdateColumnConfig,
  onUpdateColumnSettingConfig,
  selectedChartType,
  zoneId,
  className = '',
  lineGroupType,
  barGroupType,
  rowCount,
}) => {
  const {
    lineStyle,
    lineType,
    lineSymbolSize,
    columnVisualization,
    barRoundness,
    showDataLabels,
    showDataLabelsAsPercentage,
  } = columnSetting;
  const { displayName } = columnLabelFormat;
  const isBarChart = selectedChartType === 'bar';
  const isLineChart = selectedChartType === 'line';
  const isScatterChart = selectedChartType === 'scatter';
  const isComboChart = selectedChartType === 'combo';
  const isPieChart = selectedChartType === 'pie';
  const isMetricChart = selectedChartType === 'metric';
  const isYAxisZone =
    zoneId === SelectAxisContainerId.YAxis || zoneId === SelectAxisContainerId.Y2Axis;
  const isAvailableZone = zoneId === SelectAxisContainerId.Available;
  const isCategoryZone = zoneId === SelectAxisContainerId.CategoryAxis;
  const isXAxisZone = zoneId === SelectAxisContainerId.XAxis;
  const isSizeZone = zoneId === SelectAxisContainerId.SizeAxis;
  const isBarVisualization = columnVisualization === 'bar';
  const isLineVisualization = columnVisualization === 'line';
  const isTableChart = selectedChartType === 'table';
  const isTablePieChart = isTableChart || isPieChart;
  const isTableMetricPieChart = isTablePieChart || isMetricChart;

  const isPercentStacked = useMemo(() => {
    if (selectedChartType === 'bar') {
      return barGroupType === 'percentage-stack';
    }
    if (selectedChartType === 'line') {
      return lineGroupType === 'percentage-stack';
    }
    return false;
  }, [barGroupType, lineGroupType, selectedChartType]);

  const ComponentsLoop = [
    {
      enabled: !isXAxisZone && !isTableChart && !isSizeZone && !isScatterChart,
      key: 'title',
      Component: (
        <EditTitle
          displayName={displayName}
          formattedTitle={formattedTitle}
          onUpdateColumnConfig={onUpdateColumnConfig}
        />
      ),
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
      ),
    },
    {
      enabled:
        (isLineChart || (isLineVisualization && isComboChart)) && !isCategoryZone && !isXAxisZone,
      key: 'lineStyle',
      Component: (
        <EditLineStyle
          lineStyle={lineStyle}
          lineType={lineType}
          selectedChartType={selectedChartType}
          lineSymbolSize={lineSymbolSize}
          onUpdateColumnSettingConfig={onUpdateColumnSettingConfig}
        />
      ),
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
      ),
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
          rowCount={rowCount}
        />
      ),
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
      ),
    },
  ];

  const EnabledComponentsLoop = ComponentsLoop.filter(({ enabled }) => enabled);

  if (EnabledComponentsLoop.length === 0) return null;

  return (
    <>
      <div className={`${className} flex w-full flex-col space-y-3 overflow-hidden p-3`}>
        {EnabledComponentsLoop.map(({ key, Component }) => {
          return <React.Fragment key={key}>{Component}</React.Fragment>;
        })}
      </div>

      {<div className="bg-border h-[0.5px] w-full" />}
    </>
  );
};

const LabelSettings: React.FC<{
  className?: string;
  columnLabelFormat: ColumnLabelFormat;
  onUpdateColumnConfig: (columnLabelFormat: Partial<ColumnLabelFormat>) => void;
  id: string;
  zoneId: SelectAxisContainerId;
  selectedChartType: ChartConfigProps['selectedChartType'];
}> = ({
  columnLabelFormat,
  onUpdateColumnConfig,
  id,
  zoneId,
  className = '',
  selectedChartType,
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
    replaceMissingDataWith,
    isUTC,
    compactNumbers,
  } = columnLabelFormat;

  const isPieChart = selectedChartType === 'pie';
  const isScatterChart = selectedChartType === 'scatter';
  const isMetricChart = selectedChartType === 'metric';
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
      ),
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
      ),
    },
    {
      enabled: isCurrency,
      key: 'currency',
      Component: <EditCurrency currency={currency} onUpdateColumnConfig={onUpdateColumnConfig} />,
    },
    {
      enabled: isNumber || isPercentage,
      key: 'separator',
      Component: (
        <EditSeparator
          numberSeparatorStyle={numberSeparatorStyle}
          onUpdateColumnConfig={onUpdateColumnConfig}
        />
      ),
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
      ),
    },
    {
      enabled: isNumber || isPercentage || isCurrency,
      key: 'multiply',
      Component: (
        <EditMultiplyBy multiplier={multiplier} onUpdateColumnConfig={onUpdateColumnConfig} />
      ),
    },
    {
      enabled: isDate && convertNumberTo,
      key: 'dateType',
      Component: (
        <EditDateType
          convertNumberTo={convertNumberTo}
          onUpdateColumnConfig={onUpdateColumnConfig}
        />
      ),
    },
    {
      enabled: isDate,
      key: 'dateFormat',
      Component: (
        <EditDateFormat
          dateFormat={dateFormat}
          convertNumberTo={convertNumberTo}
          columnType={columnType}
          isUTC={isUTC}
          onUpdateColumnConfig={onUpdateColumnConfig}
        />
      ),
    },
    {
      enabled: !isDate && !isCurrency,
      key: 'prefix',
      Component: <EditPrefix prefix={prefix} onUpdateColumnConfig={onUpdateColumnConfig} />,
    },
    {
      enabled: !isDate && !isCurrency,
      key: 'suffix',
      Component: <EditSuffix suffix={suffix} onUpdateColumnConfig={onUpdateColumnConfig} />,
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
      ),
    },
    {
      enabled: isNumber,
      key: 'compactNumbers',
      Component: (
        <EditCompactNumbers
          compactNumbers={compactNumbers}
          onUpdateColumnConfig={onUpdateColumnConfig}
        />
      ),
    },
  ].filter(({ enabled }) => enabled);

  //essential to prefetch currencies
  useGetCurrencies();

  if (ComponentsLoop.length === 0) return null;

  return (
    <ErrorBoundary fallback={<div className="text-red-500">Error rendering label settings</div>}>
      <div className={`${className} flex w-full flex-col space-y-3 overflow-hidden p-3`}>
        {ComponentsLoop.map(({ key, Component }) => {
          return <React.Fragment key={key}>{Component}</React.Fragment>;
        })}
      </div>
    </ErrorBoundary>
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
      <div className="bg-border h-[0.5px] w-full" />
    </div>
  );
});
TitleComponent.displayName = 'TitleComponent';
