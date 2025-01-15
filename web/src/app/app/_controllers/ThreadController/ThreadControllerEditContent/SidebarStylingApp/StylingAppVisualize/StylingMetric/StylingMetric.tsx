import {
  ColumnMetaData,
  DEFAULT_COLUMN_SETTINGS,
  IBusterThreadMessageChartConfig
} from '@/api/buster-rest';
import React, { useMemo } from 'react';
import { EditMetricField } from './EditMetricField';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { useMemoizedFn } from 'ahooks';
import { EditMetricAggregate } from './EditMetricType';
import { EditMetricHeader } from './EditMetricHeaderType';
import { Divider } from 'antd';
import { DerivedMetricTitle } from '@/components/charts';
import { EditHeaderTitle } from './EditHeaderTitle';
import { createColumnFieldOptions } from './helpers';
import { createStyles } from 'antd-style';

export const StylingMetric: React.FC<{
  className?: string;
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  metricHeader: IBusterThreadMessageChartConfig['metricHeader'];
  metricSubHeader: IBusterThreadMessageChartConfig['metricSubHeader'];
  metricValueLabel: IBusterThreadMessageChartConfig['metricValueLabel'];
  metricValueAggregate: IBusterThreadMessageChartConfig['metricValueAggregate'];
  metricColumnId: IBusterThreadMessageChartConfig['metricColumnId'];
  columnMetadata: ColumnMetaData[];
}> = ({
  className,
  columnLabelFormats,
  metricHeader,
  metricSubHeader,
  metricValueLabel,
  metricValueAggregate,
  metricColumnId,
  columnMetadata
}) => {
  const { styles } = useStyles();

  const onUpdateMessageChartConfig = useBusterThreadsContextSelector(
    ({ onUpdateMessageChartConfig }) => onUpdateMessageChartConfig
  );

  const onUpdateChartConfig = useMemoizedFn(
    (chartConfig: Partial<IBusterThreadMessageChartConfig>) => {
      onUpdateMessageChartConfig({ chartConfig });
    }
  );

  const columnFieldOptions = useMemo(() => {
    return createColumnFieldOptions(columnMetadata, columnLabelFormats, styles.icon);
  }, [columnMetadata, columnLabelFormats, styles.icon]);

  return (
    <div className="flex flex-col space-y-0">
      <div className={className}>
        <PrimaryMetricStyling
          metricColumnId={metricColumnId}
          columnFieldOptions={columnFieldOptions}
          columnLabelFormats={columnLabelFormats}
          metricValueAggregate={metricValueAggregate}
          columnMetadata={columnMetadata}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      </div>

      <Divider className="!my-3 !mb-0" />

      <div className={className}>
        <HeaderMetricStyling
          header={metricHeader}
          type="header"
          metricValueAggregate={metricValueAggregate}
          columnFieldOptions={columnFieldOptions}
          columnLabelFormats={columnLabelFormats}
          columnMetadata={columnMetadata}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      </div>

      <Divider className="!my-3 !mb-0" />

      <div className={className}>
        <HeaderMetricStyling
          header={metricSubHeader}
          type="subHeader"
          metricValueAggregate={metricValueAggregate}
          columnFieldOptions={columnFieldOptions}
          columnLabelFormats={columnLabelFormats}
          columnMetadata={columnMetadata}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      </div>
    </div>
  );
};

const PrimaryMetricStyling: React.FC<{
  metricColumnId: IBusterThreadMessageChartConfig['metricColumnId'];
  metricValueAggregate: IBusterThreadMessageChartConfig['metricValueAggregate'];
  columnFieldOptions: ReturnType<typeof createColumnFieldOptions>;
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  columnMetadata: ColumnMetaData[];
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
}> = ({
  metricColumnId,
  columnLabelFormats,
  metricValueAggregate,
  columnFieldOptions,
  columnMetadata,
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
      let newConfig: Partial<IBusterThreadMessageChartConfig> = {
        metricColumnId
      };
      if (metricValueAggregate) {
        newConfig.metricValueAggregate = metricValueAggregate;
      }

      onUpdateChartConfig(newConfig);
    }
  );

  const onUpdateAggregate = useMemoizedFn(
    (aggregate: IBusterThreadMessageChartConfig['metricValueAggregate']) => {
      onUpdateChartConfig({ metricValueAggregate: aggregate });
    }
  );

  return (
    <div className="flex flex-col space-y-2">
      <EditMetricField
        columnId={metricColumnId}
        columnLabelFormats={columnLabelFormats}
        columnFieldOptions={columnFieldOptions}
        columnMetadata={columnMetadata}
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
  header:
    | IBusterThreadMessageChartConfig['metricHeader']
    | IBusterThreadMessageChartConfig['metricSubHeader'];
  columnFieldOptions: ReturnType<typeof createColumnFieldOptions>;
  columnMetadata: ColumnMetaData[];
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  type: 'header' | 'subHeader';
  metricValueAggregate: IBusterThreadMessageChartConfig['metricValueAggregate'];
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
}> = ({
  header,
  type,
  columnFieldOptions,
  columnMetadata,
  columnLabelFormats,
  metricValueAggregate,
  onUpdateChartConfig
}) => {
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
        useValue: true
      };
      if (config.metricValueAggregate) {
        newConfig.aggregate = config.metricValueAggregate;
      }
      onUpdateChartConfig({ [key]: newConfig });
    }
  );

  const onUpdateAggregate = useMemoizedFn(
    (aggregate: IBusterThreadMessageChartConfig['metricValueAggregate']) => {
      const key = type === 'header' ? 'metricHeader' : 'metricSubHeader';
      const newConfig: DerivedMetricTitle = {
        columnId: (header as DerivedMetricTitle)?.columnId,
        useValue: true
      };
      if (aggregate) {
        newConfig.aggregate = aggregate;
      }
      onUpdateChartConfig({ [key]: newConfig });
    }
  );

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
          columnMetadata={columnMetadata}
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

const useStyles = createStyles(({ css, token }) => ({
  icon: css`
    color: ${token.colorIcon};
  `
}));
