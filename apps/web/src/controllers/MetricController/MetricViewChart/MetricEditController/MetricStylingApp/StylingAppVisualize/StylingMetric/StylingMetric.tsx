import React, { useMemo } from 'react';
import type { ColumnMetaData, ChartConfigProps } from '@buster/server-shared/metrics';
import type { DerivedMetricTitle } from '@buster/server-shared/metrics';
import { Separator } from '@/components/ui/separator';
import { useUpdateMetricChart } from '@/context/Metrics';
import { useMemoizedFn } from '@/hooks';
import { EditHeaderTitle } from './EditHeaderTitle';
import { EditMetricField } from './EditMetricField';
import { EditMetricHeader } from './EditMetricHeaderType';
import { EditMetricAggregate } from './EditMetricType';
import { createColumnFieldOptions } from './helpers';

export const StylingMetric: React.FC<{
  className?: string;
  columnLabelFormats: ChartConfigProps['columnLabelFormats'];
  metricHeader: ChartConfigProps['metricHeader'];
  metricSubHeader: ChartConfigProps['metricSubHeader'];
  rowCount: number;
  metricValueAggregate: ChartConfigProps['metricValueAggregate'];
  metricColumnId: ChartConfigProps['metricColumnId'];
  columnMetadata: ColumnMetaData[];
}> = ({
  className,
  columnLabelFormats,
  metricHeader,
  metricSubHeader,
  rowCount,
  metricValueAggregate,
  metricColumnId,
  columnMetadata
}) => {
  const { onUpdateMetricChartConfig } = useUpdateMetricChart();

  const onUpdateChartConfig = useMemoizedFn((chartConfig: Partial<ChartConfigProps>) => {
    onUpdateMetricChartConfig({ chartConfig });
  });

  const columnFieldOptions = useMemo(() => {
    return createColumnFieldOptions(columnMetadata, columnLabelFormats, 'text-icon-color');
  }, [columnMetadata, columnLabelFormats]);

  return (
    <div className="flex flex-col space-y-0">
      <div className={className}>
        <PrimaryMetricStyling
          metricColumnId={metricColumnId}
          columnFieldOptions={columnFieldOptions}
          columnLabelFormats={columnLabelFormats}
          metricValueAggregate={metricValueAggregate}
          rowCount={rowCount}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      </div>

      <Separator className="my-3! mb-0!" />

      <div className={className}>
        <HeaderMetricStyling
          header={metricHeader}
          type="header"
          rowCount={rowCount}
          columnFieldOptions={columnFieldOptions}
          columnLabelFormats={columnLabelFormats}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      </div>

      <Separator className="my-3! mb-0!" />

      <div className={className}>
        <HeaderMetricStyling
          header={metricSubHeader}
          type="subHeader"
          rowCount={rowCount}
          columnFieldOptions={columnFieldOptions}
          columnLabelFormats={columnLabelFormats}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      </div>
    </div>
  );
};

const PrimaryMetricStyling: React.FC<{
  metricColumnId: ChartConfigProps['metricColumnId'];
  metricValueAggregate: ChartConfigProps['metricValueAggregate'];
  columnFieldOptions: ReturnType<typeof createColumnFieldOptions>;
  columnLabelFormats: ChartConfigProps['columnLabelFormats'];
  rowCount: number;
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = ({
  metricColumnId,
  columnLabelFormats,
  metricValueAggregate,
  columnFieldOptions,
  rowCount,
  onUpdateChartConfig
}) => {
  const onUpdateMetricField = useMemoizedFn(
    ({
      metricColumnId,
      metricValueAggregate
    }: {
      metricColumnId: string;
      metricValueAggregate?: DerivedMetricTitle['aggregate'];
    }) => {
      const newConfig: Partial<ChartConfigProps> = {
        metricColumnId
      };
      if (metricValueAggregate) {
        newConfig.metricValueAggregate = metricValueAggregate;
      }

      onUpdateChartConfig(newConfig);
    }
  );

  const onUpdateAggregate = useMemoizedFn((aggregate: ChartConfigProps['metricValueAggregate']) => {
    onUpdateChartConfig({ metricValueAggregate: aggregate });
  });

  return (
    <div className="flex flex-col space-y-2">
      <EditMetricField
        columnId={metricColumnId}
        columnLabelFormats={columnLabelFormats}
        columnFieldOptions={columnFieldOptions}
        rowCount={rowCount}
        onUpdateChartConfig={onUpdateChartConfig}
        onUpdateMetricField={onUpdateMetricField}
      />

      <EditMetricAggregate
        aggregate={metricValueAggregate}
        columnLabelFormat={columnLabelFormats[metricColumnId]}
        onUpdateAggregate={onUpdateAggregate}
      />
    </div>
  );
};

const HeaderMetricStyling: React.FC<{
  header: ChartConfigProps['metricHeader'] | ChartConfigProps['metricSubHeader'];
  columnFieldOptions: ReturnType<typeof createColumnFieldOptions>;
  rowCount: number;
  columnLabelFormats: ChartConfigProps['columnLabelFormats'];
  type: 'header' | 'subHeader';
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = ({ header, type, columnFieldOptions, rowCount, columnLabelFormats, onUpdateChartConfig }) => {
  const isStringHeader = typeof header === 'string';
  const isObjectHeader = typeof header === 'object';
  const doNotUseHeader = header === null;
  const useValue = isObjectHeader && (header as DerivedMetricTitle)?.useValue === true;

  const aggregate: DerivedMetricTitle['aggregate'] = useMemo(() => {
    if (isStringHeader) return 'first';
    return (header as DerivedMetricTitle)?.aggregate || 'first';
  }, [header, isStringHeader]);

  const columnLabelFormat = useMemo(() => {
    if (isStringHeader) return undefined;
    return columnLabelFormats[(header as DerivedMetricTitle)?.columnId];
  }, [isStringHeader, header, columnLabelFormats]);

  const firstColumnId = useMemo(() => {
    return Object.keys(columnLabelFormats)[0];
  }, [columnLabelFormats]);

  const onUpdateMetricField = useMemoizedFn(
    (config: {
      metricColumnId: string;
      metricValueAggregate?: DerivedMetricTitle['aggregate'];
    }) => {
      const key = type === 'header' ? 'metricHeader' : 'metricSubHeader';
      const newConfig: DerivedMetricTitle = {
        columnId: config.metricColumnId,
        useValue: true,
        aggregate: 'sum'
      };
      if (config.metricValueAggregate) {
        newConfig.aggregate = config.metricValueAggregate;
      }
      onUpdateChartConfig({ [key]: newConfig });
    }
  );

  const onUpdateAggregate = useMemoizedFn((aggregate: ChartConfigProps['metricValueAggregate']) => {
    const key = type === 'header' ? 'metricHeader' : 'metricSubHeader';
    const newConfig: DerivedMetricTitle = {
      columnId: (header as DerivedMetricTitle)?.columnId,
      useValue: true,
      aggregate: 'sum'
    };
    if (aggregate) {
      newConfig.aggregate = aggregate;
    }
    onUpdateChartConfig({ [key]: newConfig });
  });

  const ComponentsLoop: {
    key: string;
    component: React.ReactNode;
    enabled: boolean;
  }[] = [
    {
      key: 'header',
      enabled: true,
      component: (
        <EditMetricHeader
          firstColumnId={firstColumnId}
          header={header}
          type={type}
          hideDerivedMetricOption={false}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    },
    {
      enabled: isObjectHeader && !doNotUseHeader,
      key: 'field',
      component: (
        <EditMetricField
          columnFieldOptions={columnFieldOptions}
          rowCount={rowCount}
          columnId={(header as DerivedMetricTitle)?.columnId}
          columnLabelFormats={columnLabelFormats}
          onUpdateChartConfig={onUpdateChartConfig}
          onUpdateMetricField={onUpdateMetricField}
          label={type === 'header' ? 'Header column' : 'Sub-header column'}
        />
      )
    },
    {
      key: 'aggregate',
      enabled: isObjectHeader && useValue && columnLabelFormat?.style === 'number',
      component: (
        <EditMetricAggregate
          aggregate={aggregate}
          columnId={(header as DerivedMetricTitle)?.columnId}
          columnLabelFormat={columnLabelFormat}
          onUpdateAggregate={onUpdateAggregate}
        />
      )
    },
    {
      key: 'title',
      enabled: isStringHeader,
      component: (
        <EditHeaderTitle
          value={header as string}
          type={type}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      )
    }
  ].filter(({ enabled }) => enabled);

  return (
    <div className="flex flex-col space-y-2">
      {ComponentsLoop.map(({ key, component, enabled }) => (
        <React.Fragment key={key}>{enabled && component}</React.Fragment>
      ))}
    </div>
  );
};
