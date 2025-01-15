import { Divider } from 'antd';
import React, { useMemo } from 'react';
import { EditShowLegend } from './EditShowLegend';
import { EditGridLines } from './EditGridLines';
import { EditHideYAxis } from './EditHideYAxis';
import { EditShowDataLabels } from './EditShowDataLabels';
import { useMemoizedFn } from 'ahooks';
import type { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { EditBarSorting } from './EditBarAxisSorting';
import { EditGrouping } from '../StylingAppVisualize/SelectAxis/SelectAxisSettingsContent/EditGrouping';
import { EditBarRoundnessGlobal } from './EditBarRoundnessGlobal';
import { EditSmoothLinesGlobal } from './EditSmoothLinesGlobal';
import { EditDotsOnLineGlobal } from './EditDotsOnLineGlobal';
import { EditYAxisScaleGlobal } from './EditYAxisScaleGlobal';
import { EditReplaceMissingValuesWithGlobal } from './EditReplaceMissingValuesWithGlobal';
import { EditShowHeadline } from './EditShowHeadline';
import { EditGoalLine } from './EditShowGoalLine';
import { EditTrendline } from './EditTrendline';
import { EditShowLabelPieAsPercentage } from './EditShowLabelPieAsPercentage';
import { EditPieLabelLocation } from './EditPieLabelLocation';
import { EditPieAppearance } from './EditPieAppearance';
import { EditPieMinimumSlicePercentage } from './EditPieMinimumSlicePercentage';
import { EditPieInnerLabel } from './EditPieInnerLabel';
import { EditPieShowInnerLabel } from './EditPieShowInnerLabel';
import { BarAndLineAxis, ChartEncodes, ChartType, ScatterAxis } from '@/components/charts';
import { StylingAppStylingNotSupported } from './StylingAppStylingNotSupported';
import { EditScatterDotSize } from './EditScatterDotSize';
import { ColumnMetaData } from '@/api/buster-rest';

const sectionClass = 'flex w-full flex-col space-y-3 my-3 ';
const UNSUPPORTED_CHART_TYPES: ChartType[] = [ChartType.Table, ChartType.Metric];

export const StylingAppStyling: React.FC<{
  className?: string;
  columnSettings: IBusterThreadMessageChartConfig['columnSettings'];
  showLegend: IBusterThreadMessageChartConfig['showLegend'];
  gridLines: IBusterThreadMessageChartConfig['gridLines'];
  yAxisShowAxisLabel: IBusterThreadMessageChartConfig['yAxisShowAxisLabel'];
  yAxisShowAxisTitle: IBusterThreadMessageChartConfig['yAxisShowAxisTitle'];
  barSortBy: IBusterThreadMessageChartConfig['barSortBy'];
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  lineGroupType: IBusterThreadMessageChartConfig['lineGroupType'];
  barGroupType: IBusterThreadMessageChartConfig['barGroupType'];
  pieChartAxis: IBusterThreadMessageChartConfig['pieChartAxis'];
  yAxisScaleType: IBusterThreadMessageChartConfig['yAxisScaleType'];
  y2AxisScaleType: IBusterThreadMessageChartConfig['y2AxisScaleType'];
  showLegendHeadline: IBusterThreadMessageChartConfig['showLegendHeadline'];
  goalLines: IBusterThreadMessageChartConfig['goalLines'];
  trendlines: IBusterThreadMessageChartConfig['trendlines'];
  pieDisplayLabelAs: IBusterThreadMessageChartConfig['pieDisplayLabelAs'];
  pieLabelPosition: IBusterThreadMessageChartConfig['pieLabelPosition'];
  pieDonutWidth: IBusterThreadMessageChartConfig['pieDonutWidth'];
  pieInnerLabelAggregate: IBusterThreadMessageChartConfig['pieInnerLabelAggregate'];
  pieInnerLabelTitle: IBusterThreadMessageChartConfig['pieInnerLabelTitle'];
  pieShowInnerLabel: IBusterThreadMessageChartConfig['pieShowInnerLabel'];
  pieMinimumSlicePercentage: IBusterThreadMessageChartConfig['pieMinimumSlicePercentage'];
  scatterDotSize: IBusterThreadMessageChartConfig['scatterDotSize'];
  selectedAxis: ChartEncodes;
  columnMetadata: ColumnMetaData[];
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  barShowTotalAtTop: IBusterThreadMessageChartConfig['barShowTotalAtTop'];
}> = ({
  className = '',
  columnSettings,
  showLegend,
  gridLines,
  yAxisShowAxisLabel,
  barSortBy,
  selectedChartType,
  lineGroupType,
  barGroupType,
  yAxisScaleType,
  y2AxisScaleType,
  showLegendHeadline,
  goalLines,
  trendlines,
  pieDisplayLabelAs,
  pieLabelPosition,
  pieDonutWidth,
  pieInnerLabelAggregate,
  pieInnerLabelTitle,
  pieShowInnerLabel,
  pieMinimumSlicePercentage,
  pieChartAxis,
  scatterDotSize,
  selectedAxis,
  columnMetadata,
  columnLabelFormats,
  barShowTotalAtTop,
  yAxisShowAxisTitle
}) => {
  const onUpdateMessageChartConfig = useBusterThreadsContextSelector(
    (x) => x.onUpdateMessageChartConfig
  );

  const onUpdateDataLabel = useMemoizedFn((v: boolean) => {
    const newColumnSettings: IBusterThreadMessageChartConfig['columnSettings'] = Object.keys(
      columnSettings
    ).reduce<IBusterThreadMessageChartConfig['columnSettings']>((acc, curr) => {
      acc[curr] = { ...columnSettings[curr], showDataLabels: v };
      return acc;
    }, {});
    onUpdateChartConfig({ columnSettings: newColumnSettings });
  });

  const onUpdateChartConfig = useMemoizedFn(
    (chartConfig: Partial<IBusterThreadMessageChartConfig>) => {
      onUpdateMessageChartConfig({ chartConfig });
    }
  );

  const onUpdateYAxis = useMemoizedFn((v: boolean) => {
    const hide = !v;
    onUpdateChartConfig({
      yAxisShowAxisLabel: hide,
      yAxisShowAxisTitle: hide
    });
  });

  const isUnsupportedChartType = useMemo(
    () => UNSUPPORTED_CHART_TYPES.includes(selectedChartType),
    [selectedChartType]
  );

  if (isUnsupportedChartType) {
    return <StylingAppStylingNotSupported selectedChartType={selectedChartType} />;
  }

  return (
    <div className="flex w-full flex-col">
      <GlobalSettings
        showLegend={showLegend}
        gridLines={gridLines}
        yAxisShowAxisTitle={yAxisShowAxisTitle}
        yAxisShowAxisLabel={yAxisShowAxisLabel}
        columnSettings={columnSettings}
        pieDisplayLabelAs={pieDisplayLabelAs}
        selectedChartType={selectedChartType}
        pieLabelPosition={pieLabelPosition}
        selectedAxis={selectedAxis}
        onUpdateChartConfig={onUpdateChartConfig}
        onUpdateDataLabel={onUpdateDataLabel}
        onUpdateYAxis={onUpdateYAxis}
        className={className}
      />

      <Divider />

      <ChartSpecificSettings
        columnSettings={columnSettings}
        selectedChartType={selectedChartType}
        barSortBy={barSortBy}
        onUpdateChartConfig={onUpdateChartConfig}
        lineGroupType={lineGroupType}
        barGroupType={barGroupType}
        yAxisScaleType={yAxisScaleType}
        y2AxisScaleType={y2AxisScaleType}
        pieDonutWidth={pieDonutWidth}
        pieMinimumSlicePercentage={pieMinimumSlicePercentage}
        className={className}
        pieChartAxis={pieChartAxis}
        scatterDotSize={scatterDotSize}
        selectedAxis={selectedAxis}
        columnLabelFormats={columnLabelFormats}
        barShowTotalAtTop={barShowTotalAtTop}
      />

      {selectedChartType === 'pie' && (
        <>
          <PieSettings
            className={className}
            pieInnerLabelAggregate={pieInnerLabelAggregate}
            pieShowInnerLabel={pieShowInnerLabel}
            pieInnerLabelTitle={pieInnerLabelTitle}
            pieDonutWidth={pieDonutWidth}
            onUpdateChartConfig={onUpdateChartConfig}
          />

          <Divider />
        </>
      )}

      <EtcSettings
        className={className}
        selectedChartType={selectedChartType}
        showLegendHeadline={showLegendHeadline}
        goalLines={goalLines}
        trendlines={trendlines}
        selectedAxis={selectedAxis}
        columnMetadata={columnMetadata}
        columnLabelFormats={columnLabelFormats}
        lineGroupType={lineGroupType}
        barGroupType={barGroupType}
        onUpdateChartConfig={onUpdateChartConfig}
      />
    </div>
  );
};

const GlobalSettings: React.FC<{
  className: string;
  showLegend: IBusterThreadMessageChartConfig['showLegend'];
  gridLines: IBusterThreadMessageChartConfig['gridLines'];
  columnSettings: IBusterThreadMessageChartConfig['columnSettings'];
  yAxisShowAxisTitle: IBusterThreadMessageChartConfig['yAxisShowAxisTitle'];
  yAxisShowAxisLabel: IBusterThreadMessageChartConfig['yAxisShowAxisLabel'];
  pieDisplayLabelAs: IBusterThreadMessageChartConfig['pieDisplayLabelAs'];
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  pieLabelPosition: IBusterThreadMessageChartConfig['pieLabelPosition'];
  selectedAxis: ChartEncodes;
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
  onUpdateDataLabel: (v: boolean) => void;
  onUpdateYAxis: (v: boolean) => void;
}> = ({
  className = '',
  showLegend,
  selectedAxis,
  gridLines,
  columnSettings,
  yAxisShowAxisLabel,
  pieDisplayLabelAs,
  selectedChartType,
  pieLabelPosition,
  yAxisShowAxisTitle,
  onUpdateChartConfig,
  onUpdateDataLabel,
  onUpdateYAxis
}) => {
  const isPieChart = selectedChartType === 'pie';
  const isComboChart = selectedChartType === 'combo';
  const isScatterChart = selectedChartType === 'scatter';

  const mostPermissiveDataLabel: boolean = useMemo(() => {
    return Object.values(columnSettings).some((x) => x.showDataLabels);
  }, []);

  const mostPermissiveHideYAxis: boolean = useMemo(() => {
    return yAxisShowAxisLabel === false || yAxisShowAxisTitle === false;
  }, [yAxisShowAxisLabel, yAxisShowAxisTitle]);

  const ComponentsLoop: {
    enabled: boolean;
    key: string;
    Component: React.ReactNode;
  }[] = [
    {
      key: 'showLegend',
      enabled: true,
      Component: (
        <EditShowLegend
          selectedChartType={selectedChartType}
          showLegend={showLegend}
          selectedAxis={selectedAxis}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    },
    {
      key: 'showDataLabels',
      enabled: !isPieChart && !isScatterChart,
      Component: (
        <EditShowDataLabels
          showDataLabels={mostPermissiveDataLabel}
          onUpdateColumnSettingConfig={onUpdateDataLabel}
        />
      )
    },
    {
      key: 'gridLines',
      enabled: !isPieChart && !isComboChart,
      Component: <EditGridLines gridLines={gridLines} onUpdateChartConfig={onUpdateChartConfig} />
    },
    {
      key: 'hideYAxis',
      enabled: !isPieChart && !isComboChart,
      Component: <EditHideYAxis hideYAxis={mostPermissiveHideYAxis} onUpdateYAxis={onUpdateYAxis} />
    },
    {
      key: 'showLabelPieAsPercentage',
      enabled: isPieChart,
      Component: (
        <EditShowLabelPieAsPercentage
          pieDisplayLabelAs={pieDisplayLabelAs}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    },
    {
      key: 'pieLabelLocation',
      enabled: isPieChart,
      Component: (
        <EditPieLabelLocation
          pieLabelPosition={pieLabelPosition}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    }
  ].filter((x) => x.enabled);

  return (
    <div className={`${sectionClass} ${className}`}>
      {ComponentsLoop.map(({ key, Component }) => {
        return <React.Fragment key={key}>{Component}</React.Fragment>;
      })}
    </div>
  );
};

const ChartSpecificSettings: React.FC<{
  className: string;
  columnSettings: IBusterThreadMessageChartConfig['columnSettings'];
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  barSortBy: IBusterThreadMessageChartConfig['barSortBy'];
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
  lineGroupType: IBusterThreadMessageChartConfig['lineGroupType'];
  barGroupType: IBusterThreadMessageChartConfig['barGroupType'];
  yAxisScaleType: IBusterThreadMessageChartConfig['yAxisScaleType'];
  y2AxisScaleType: IBusterThreadMessageChartConfig['y2AxisScaleType'];
  pieDonutWidth: IBusterThreadMessageChartConfig['pieDonutWidth'];
  pieMinimumSlicePercentage: IBusterThreadMessageChartConfig['pieMinimumSlicePercentage'];
  pieChartAxis: IBusterThreadMessageChartConfig['pieChartAxis'];
  scatterDotSize: IBusterThreadMessageChartConfig['scatterDotSize'];
  selectedAxis: ChartEncodes;
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  barShowTotalAtTop: IBusterThreadMessageChartConfig['barShowTotalAtTop'];
}> = ({
  className = '',
  barSortBy,
  onUpdateChartConfig,
  columnSettings,
  selectedChartType,
  pieChartAxis,
  lineGroupType,
  barGroupType,
  yAxisScaleType,
  y2AxisScaleType,
  pieDonutWidth,
  pieMinimumSlicePercentage,
  scatterDotSize,
  selectedAxis,
  columnLabelFormats,
  barShowTotalAtTop
}) => {
  const isBarChart = selectedChartType === 'bar';
  const isComboChart = selectedChartType === 'combo';
  const isLineChart = selectedChartType === 'line';
  const isScatterChart = selectedChartType === 'scatter';
  const isPieChart = selectedChartType === 'pie';

  const ComponentsLoop: {
    enabled: boolean;
    key: string;
    Component: React.ReactNode;
  }[] = [
    {
      enabled: isBarChart || isComboChart,
      key: 'barRoundness',
      Component: (
        <EditBarRoundnessGlobal
          columnSettings={columnSettings}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    },
    {
      enabled: isBarChart,
      key: 'barSorting',
      Component: <EditBarSorting barSortBy={barSortBy} onUpdateChartConfig={onUpdateChartConfig} />
    },
    {
      enabled:
        isBarChart &&
        (selectedAxis.y.length > 1 || !!(selectedAxis as BarAndLineAxis).category?.length),
      key: 'grouping',
      Component: (
        <EditGrouping
          selectedChartType={selectedChartType}
          lineGroupType={lineGroupType}
          barGroupType={barGroupType}
          onUpdateChartConfig={onUpdateChartConfig}
          barShowTotalAtTop={barShowTotalAtTop}
        />
      )
    },
    {
      enabled: isLineChart || isComboChart,
      key: 'smoothLines',
      Component: (
        <EditSmoothLinesGlobal
          columnSettings={columnSettings}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    },
    {
      enabled: isLineChart || isComboChart,
      key: 'dotsOnLine',
      Component: (
        <EditDotsOnLineGlobal
          columnSettings={columnSettings}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    },
    {
      enabled: isLineChart,
      key: 'yAxisScale',
      Component: (
        <EditYAxisScaleGlobal
          yAxisScaleType={yAxisScaleType}
          y2AxisScaleType={y2AxisScaleType}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    },
    {
      enabled: isLineChart || isComboChart,
      key: 'replaceMissingValuesWith',
      Component: (
        <EditReplaceMissingValuesWithGlobal
          columnLabelFormats={columnLabelFormats}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    },
    {
      enabled: isPieChart,
      key: 'pieAppearance',
      Component: (
        <EditPieAppearance
          pieDonutWidth={pieDonutWidth}
          pieChartAxis={pieChartAxis}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    },
    {
      enabled: isPieChart,
      key: 'pieMinimumSlicePercentage',
      Component: (
        <EditPieMinimumSlicePercentage
          pieMinimumSlicePercentage={pieMinimumSlicePercentage}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    },
    {
      enabled: isScatterChart,
      key: 'scatterDotSize',
      Component: (
        <EditScatterDotSize
          scatterDotSize={scatterDotSize}
          scatterAxis={selectedAxis as ScatterAxis}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    }
  ].filter((x) => x.enabled);

  if (ComponentsLoop.length === 0) return null;

  return (
    <>
      <div className={`${sectionClass} ${className}`}>
        {ComponentsLoop.map(({ enabled, key, Component }) => {
          return <React.Fragment key={key}>{Component}</React.Fragment>;
        })}
      </div>

      {selectedChartType !== 'pie' && <Divider />}
    </>
  );
};

const EtcSettings: React.FC<{
  className: string;
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  showLegendHeadline: IBusterThreadMessageChartConfig['showLegendHeadline'];
  goalLines: IBusterThreadMessageChartConfig['goalLines'];
  trendlines: IBusterThreadMessageChartConfig['trendlines'];
  selectedAxis: ChartEncodes;
  columnMetadata: ColumnMetaData[];
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  lineGroupType: IBusterThreadMessageChartConfig['lineGroupType'];
  barGroupType: IBusterThreadMessageChartConfig['barGroupType'];
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
}> = ({
  className = '',
  onUpdateChartConfig,
  selectedChartType,
  showLegendHeadline,
  goalLines,
  trendlines,
  selectedAxis,
  columnMetadata,
  columnLabelFormats,
  lineGroupType,
  barGroupType
}) => {
  const isScatterChart = selectedChartType === 'scatter';
  const isPieChart = selectedChartType === 'pie';
  const hasYAxisValues = selectedAxis.y.length > 0;

  const ComponentsLoop: {
    enabled: boolean;
    key: string;
    Component: React.ReactNode;
  }[] = [
    {
      enabled: !isScatterChart,
      key: 'showHeadline',
      Component: (
        <EditShowHeadline
          showLegendHeadline={showLegendHeadline}
          onUpdateChartConfig={onUpdateChartConfig}
          lineGroupType={lineGroupType}
          barGroupType={barGroupType}
          selectedChartType={selectedChartType}
        />
      )
    },
    {
      enabled: !isScatterChart && !isPieChart && hasYAxisValues,
      key: 'goalLine',
      Component: (
        <EditGoalLine
          goalLines={goalLines}
          columnMetadata={columnMetadata}
          selectedAxis={selectedAxis}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    },
    {
      enabled: !isPieChart && hasYAxisValues,
      key: 'trendline',
      Component: (
        <EditTrendline
          trendlines={trendlines}
          columnLabelFormats={columnLabelFormats}
          selectedAxis={selectedAxis}
          columnMetadata={columnMetadata}
          selectedChartType={selectedChartType}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    }
  ].filter((x) => x.enabled);

  return (
    <div className={`${sectionClass} ${className}`}>
      {ComponentsLoop.map(({ key, Component }) => {
        return <React.Fragment key={key}>{Component}</React.Fragment>;
      })}
    </div>
  );
};

const PieSettings: React.FC<{
  className: string;
  pieInnerLabelAggregate: IBusterThreadMessageChartConfig['pieInnerLabelAggregate'];
  pieShowInnerLabel: IBusterThreadMessageChartConfig['pieShowInnerLabel'];
  pieInnerLabelTitle: IBusterThreadMessageChartConfig['pieInnerLabelTitle'];
  pieDonutWidth: IBusterThreadMessageChartConfig['pieDonutWidth'];
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
}> = React.memo(
  ({
    className,
    pieInnerLabelAggregate,
    pieShowInnerLabel,
    pieInnerLabelTitle,
    pieDonutWidth,
    onUpdateChartConfig
  }) => {
    const isDonut = pieDonutWidth !== 0;

    if (!isDonut) return null;

    return (
      <>
        <Divider />

        <div className={`${sectionClass} ${className}`}>
          <EditPieShowInnerLabel
            pieShowInnerLabel={pieShowInnerLabel}
            onUpdateChartConfig={onUpdateChartConfig}
          />

          {pieShowInnerLabel && (
            <EditPieInnerLabel
              pieInnerLabelAggregate={pieInnerLabelAggregate}
              pieInnerLabelTitle={pieInnerLabelTitle}
              onUpdateChartConfig={onUpdateChartConfig}
            />
          )}
        </div>
      </>
    );
  }
);
PieSettings.displayName = 'PieSettings';
