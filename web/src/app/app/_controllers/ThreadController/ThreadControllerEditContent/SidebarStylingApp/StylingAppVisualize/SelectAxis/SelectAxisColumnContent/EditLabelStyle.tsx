import type { IColumnLabelFormat } from '@/components/charts/interfaces/columnLabelInterfaces';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { AppSegmented, AppTooltip } from '@/components';
import { ColumnTypeIcon } from '../config';
import { useEditAppSegmented } from './useEditAppSegmented';
import { createStyles } from 'antd-style';
import { isDateColumnType, isNumericColumnType } from '@/utils';

export const EditLabelStyle: React.FC<{
  onUpdateColumnConfig: (columnLabelFormat: Partial<IColumnLabelFormat>) => void;
  style: IColumnLabelFormat['style'];
  columnType: IColumnLabelFormat['columnType'];
  convertNumberTo: IColumnLabelFormat['convertNumberTo'];
}> = React.memo(({ onUpdateColumnConfig, style, convertNumberTo, columnType }) => {
  const { styles, cx } = useStyles();

  const enabledOptions: IColumnLabelFormat['style'][] = useMemo(() => {
    if (isNumericColumnType(columnType))
      return ['number', 'percent', 'currency', convertNumberTo ? 'date' : undefined].filter(
        Boolean
      ) as IColumnLabelFormat['style'][];
    if (isDateColumnType(columnType)) return ['date'];
    return [] as IColumnLabelFormat['style'][];
  }, [columnType]);

  const options = useMemo(() => {
    const filteredOptions = enabledOptions.map((option) => ColumnTypeIcon[option]);
    return filteredOptions.map((option) => ({
      value: option.value,
      label: (
        <AppTooltip mouseEnterDelay={0.75} className={cx(styles.icon)} title={option.tooltip}>
          {option.icon}
        </AppTooltip>
      )
    }));
  }, [enabledOptions]);

  const { onClick } = useEditAppSegmented({
    onClick: (value) => {
      onUpdateColumnConfig({
        style: value as IColumnLabelFormat['style']
      });
    }
  });

  if (enabledOptions.length === 0) return null;

  return (
    <LabelAndInput label="Style">
      <div className="flex items-center justify-end">
        <AppSegmented bordered={false} options={options} value={style} onClick={onClick} />
      </div>
    </LabelAndInput>
  );
});
EditLabelStyle.displayName = 'EditLabelStyle';

const useStyles = createStyles(({ css, token }) => ({
  icon: css`
    color: ${token.colorIcon};
  `
}));
