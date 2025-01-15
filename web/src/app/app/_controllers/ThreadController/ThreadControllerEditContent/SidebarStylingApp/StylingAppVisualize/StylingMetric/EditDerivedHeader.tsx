import type { IBusterThreadMessageChartConfig, ColumnMetaData } from '@/api/buster-rest';
import { AppPopover, AppMaterialIcons } from '@/components';
import type { IColumnLabelFormat, DerivedMetricTitle } from '@/components/charts';
import { formatLabel, isNumericColumnType, isNumericColumnStyle } from '@/utils';
import { useMemoizedFn } from 'ahooks';
import { Input, Button, Divider, Switch, Select } from 'antd';
import { createStyles } from 'antd-style';
import last from 'lodash/last';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../Common';
import { AGGREGATE_OPTIONS } from './EditMetricType';
import { Text } from '@/components/text';
import { createColumnFieldOptions } from './helpers';

const DEFAULT_METRIC_HEADER: Required<IBusterThreadMessageChartConfig['metricHeader']> = {
  columnId: '',
  useValue: false,
  aggregate: 'sum'
};

type NonNullableHeader =
  | NonNullable<IBusterThreadMessageChartConfig['metricHeader']>
  | NonNullable<IBusterThreadMessageChartConfig['metricSubHeader']>;

export const DerivedTitleInput: React.FC<{
  type: 'header' | 'subHeader';
  header:
    | IBusterThreadMessageChartConfig['metricHeader']
    | IBusterThreadMessageChartConfig['metricSubHeader'];
  columnLabelFormat: IColumnLabelFormat;
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  metricColumnId: IBusterThreadMessageChartConfig['metricColumnId'];
  columnMetadata: ColumnMetaData[];
  onUpdateHeaderConfig: (newMetricHeader: IBusterThreadMessageChartConfig['metricHeader']) => void;
}> = React.memo(
  ({
    type,
    header: headerProp,
    columnLabelFormats,
    columnLabelFormat,
    metricColumnId,
    columnMetadata,
    onUpdateHeaderConfig
  }) => {
    const header = useMemo(() => {
      const isStringHeader = typeof headerProp === 'string';

      if (isStringHeader) return headerProp;

      if (headerProp === null) {
        return {
          useValue: false,
          columnId: metricColumnId,
          aggregate: 'sum'
        } as DerivedMetricTitle;
      }

      return headerProp;
    }, [headerProp]);

    const isStringHeader = typeof header === 'string';

    const onUpdateHeader = useMemoizedFn(
      (
        newHeader:
          | Partial<IBusterThreadMessageChartConfig['metricHeader']>
          | Partial<IBusterThreadMessageChartConfig['metricSubHeader']>
      ) => {
        if (typeof newHeader === 'string') {
          return onUpdateHeaderConfig(newHeader);
        } else {
          if (typeof header === 'string') {
            return onUpdateHeaderConfig({
              ...DEFAULT_METRIC_HEADER,
              columnId: metricColumnId,
              ...newHeader
            });
          } else {
            return onUpdateHeaderConfig({ ...DEFAULT_METRIC_HEADER, ...header, ...newHeader });
          }
        }
      }
    );

    const value = useMemo(() => {
      if (isStringHeader) {
        return header;
      }
    }, [isStringHeader, header]);

    const placeholder = useMemo(() => {
      if (isStringHeader) {
        return 'Type or link a value';
      }
      const { useValue, columnId, aggregate } = header;
      const columnLabelFormat = columnLabelFormats[columnId];
      let label = formatLabel(columnId, columnLabelFormat, true);
      if (useValue && aggregate) {
        const aggregateLabel =
          AGGREGATE_OPTIONS.find(({ value }) => value === aggregate)?.label || '';
        label = `${label} (${aggregateLabel})`;
      }
      return label;
    }, [value]);

    return (
      <div className="relative">
        <Input
          className="w-full"
          value={value}
          disabled={false}
          placeholder={placeholder}
          onChange={(e) => {
            onUpdateHeader(e.target.value);
          }}
          suffix={
            <DerivedTitleSuffix
              columnLabelFormat={columnLabelFormat}
              header={header}
              columnMetadata={columnMetadata}
              metricColumnId={metricColumnId}
              columnLabelFormats={columnLabelFormats}
              type={type}
              onUpdateHeader={onUpdateHeader}
            />
          }
        />
      </div>
    );
  }
);
DerivedTitleInput.displayName = 'DerivedTitleInput';

const DerivedTitleSuffix: React.FC<{
  columnLabelFormat: IColumnLabelFormat;
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  metricColumnId: IBusterThreadMessageChartConfig['metricColumnId'];
  columnMetadata: ColumnMetaData[];
  header: NonNullableHeader;
  onUpdateHeader: OnUpdateHeaderType;
  type: 'header' | 'subHeader';
}> = ({
  columnLabelFormat,
  columnLabelFormats,
  header,
  onUpdateHeader,
  metricColumnId,
  columnMetadata,
  type
}) => {
  const isStringHeader = typeof header === 'string';
  const buttonIcon = isStringHeader ? 'link_off' : 'link';

  return (
    <div className="flex" onClick={(e) => e.stopPropagation()}>
      <AppPopover
        placement="topLeft"
        trigger="click"
        destroyTooltipOnHide
        content={
          <DerivedTitleSuffixContent
            columnLabelFormat={columnLabelFormat}
            header={header}
            metricColumnId={metricColumnId}
            columnMetadata={columnMetadata}
            columnLabelFormats={columnLabelFormats}
            onUpdateHeader={onUpdateHeader}
            type={type}
          />
        }>
        <Button className="!h-[18px]" type="text" icon={<AppMaterialIcons icon={buttonIcon} />} />
      </AppPopover>
    </div>
  );
};

const DerivedTitleSuffixContent: React.FC<{
  type: 'header' | 'subHeader';
  columnLabelFormat: IColumnLabelFormat;
  metricColumnId: IBusterThreadMessageChartConfig['metricColumnId'];
  columnMetadata: ColumnMetaData[];
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  header: NonNullableHeader;
  onUpdateHeader: OnUpdateHeaderType;
}> = ({ type, columnLabelFormats, header, onUpdateHeader, columnMetadata }) => {
  const isStringHeader = typeof header === 'string';
  const headerColumnId = typeof header === 'object' ? header.columnId : '';
  const headerUseValue = typeof header === 'object' && header.useValue;

  const ComponentsLoop: {
    key: string;
    enabled: boolean;
    Component: React.ReactNode;
  }[] = [
    {
      key: 'link',
      enabled: true,
      Component: (
        <ToggleHeaderLink isStringHeader={isStringHeader} onUpdateHeader={onUpdateHeader} />
      )
    },
    {
      key: 'columnId',
      enabled: !isStringHeader,
      Component: (
        <DerivedTitleColumnId
          headerColumnId={headerColumnId}
          onUpdateHeader={onUpdateHeader}
          columnMetadata={columnMetadata}
          columnLabelFormats={columnLabelFormats}
        />
      )
    },
    {
      key: 'useValue',
      enabled: !isStringHeader,
      Component: <ToggleUseColumnValue onUpdateHeader={onUpdateHeader} useValue={headerUseValue} />
    },

    {
      key: 'aggregate',
      enabled: !isStringHeader && headerUseValue,
      Component: (
        <DerivedTitleAggregate
          onUpdateHeader={onUpdateHeader}
          aggregate={typeof header === 'object' && header.aggregate ? header.aggregate : 'sum'}
          columnLabelFormat={columnLabelFormats[headerColumnId]}
        />
      )
    }
  ];

  return (
    <div className="flex w-[285px] max-w-[285px] flex-col">
      <DerivedTitleSuffixContentHeader type={type} />

      <Divider />

      <div className="flex flex-col space-y-2 p-3">
        {ComponentsLoop.map(({ enabled, key, Component }) => {
          if (!enabled) return null;
          return <React.Fragment key={key}>{Component}</React.Fragment>;
        })}
      </div>
    </div>
  );
};

const DerivedTitleSuffixContentHeader: React.FC<{
  type: 'header' | 'subHeader';
}> = React.memo(
  ({ type }) => {
    const title = type === 'header' ? 'Header settings' : 'Sub-header settings';

    return (
      <div className="p-3">
        <Text>{title}</Text>
      </div>
    );
  },
  () => true
);
DerivedTitleSuffixContentHeader.displayName = 'DerivedTitleSuffixContentHeader';

const ToggleUseColumnValue: React.FC<{
  onUpdateHeader: OnUpdateHeaderType;
  useValue: boolean;
}> = React.memo(({ onUpdateHeader, useValue }) => {
  return (
    <LabelAndInput label="Use column value">
      <div className="flex justify-end">
        <Switch checked={useValue} onChange={(v) => onUpdateHeader({ useValue: v })} />
      </div>
    </LabelAndInput>
  );
});
ToggleUseColumnValue.displayName = 'ToggleUseColumnValue';

const ToggleHeaderLink: React.FC<{
  isStringHeader: boolean;
  onUpdateHeader: OnUpdateHeaderType;
}> = React.memo(({ isStringHeader, onUpdateHeader }) => {
  return (
    <LabelAndInput label="Use column">
      <div className="flex justify-end">
        <Switch
          checked={!isStringHeader}
          onChange={(v) => {
            onUpdateHeader(v ? {} : '');
          }}
        />
      </div>
    </LabelAndInput>
  );
});
ToggleHeaderLink.displayName = 'ToggleHeaderLink';

const DerivedTitleColumnId: React.FC<{
  headerColumnId: IBusterThreadMessageChartConfig['metricColumnId'];
  onUpdateHeader: OnUpdateHeaderType;
  columnMetadata: ColumnMetaData[];
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
}> = React.memo(({ headerColumnId, onUpdateHeader, columnMetadata, columnLabelFormats }) => {
  const { styles } = useStyles();

  const columnOptions = useMemo(() => {
    return createColumnFieldOptions(columnMetadata, columnLabelFormats, styles.icon);
  }, [columnMetadata, columnLabelFormats, styles.icon]);

  const selectedColumn = useMemo(() => {
    return columnOptions.find((option) => option.value === headerColumnId);
  }, [headerColumnId, columnOptions]);

  const onChangeSelect = useMemoizedFn((v: string) => {
    const columnLabelFormat = columnLabelFormats[v];
    const isNumberColumn = isNumericColumnType(columnLabelFormat?.columnType);
    const isNumericStyle = isNumericColumnStyle(columnLabelFormat?.style);
    const newHeader: Partial<IBusterThreadMessageChartConfig['metricHeader']> = { columnId: v };
    if (!isNumberColumn || !isNumericStyle) {
      newHeader.aggregate = 'first';
    }
    onUpdateHeader(newHeader);
  });

  return (
    <LabelAndInput label="Column ID">
      <Select
        className="w-full overflow-hidden"
        options={columnOptions}
        value={selectedColumn?.value}
        onChange={onChangeSelect}
      />
    </LabelAndInput>
  );
});
DerivedTitleColumnId.displayName = 'DerivedTitleColumnId';

const DerivedTitleAggregate: React.FC<{
  onUpdateHeader: OnUpdateHeaderType;
  aggregate: Required<DerivedMetricTitle>['aggregate'];
  columnLabelFormat: IColumnLabelFormat;
}> = React.memo(({ onUpdateHeader, aggregate, columnLabelFormat }) => {
  const isNumberColumn = isNumericColumnType(columnLabelFormat?.columnType);
  const isNumericStyle = isNumericColumnStyle(columnLabelFormat?.style);
  const disableOptions = !isNumberColumn || !isNumericStyle;

  const selectedOption = useMemo(() => {
    if (!disableOptions) {
      return AGGREGATE_OPTIONS.find((option) => option.value === aggregate)?.value;
    }
    return last(AGGREGATE_OPTIONS)?.value;
  }, [aggregate, disableOptions]);

  return (
    <LabelAndInput label="Aggregate">
      <Select
        options={AGGREGATE_OPTIONS}
        value={selectedOption}
        disabled={disableOptions}
        onChange={(v) =>
          onUpdateHeader({ aggregate: v as Required<DerivedMetricTitle>['aggregate'] })
        }
      />
    </LabelAndInput>
  );
});
DerivedTitleAggregate.displayName = 'DerivedTitleAggregate';

type OnUpdateHeaderType = (
  header:
    | Partial<IBusterThreadMessageChartConfig['metricHeader']>
    | Partial<IBusterThreadMessageChartConfig['metricSubHeader']>
) => void;

const useStyles = createStyles(({ token }) => ({
  icon: token.colorIcon
}));
