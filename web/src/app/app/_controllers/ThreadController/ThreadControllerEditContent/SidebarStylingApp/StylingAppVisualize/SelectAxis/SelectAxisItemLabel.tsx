import { IColumnLabelFormat } from '@/components/charts';
import { formatLabel } from '@/utils';
import React, { useMemo } from 'react';
import { Text } from '@/components/text';
import { createStyles } from 'antd-style';
import { ColumnTypeIcon } from './config';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/buster-rest';

export const SelectAxisItemLabel = React.memo(
  ({
    id,
    columnLabelFormat,
    onClick
  }: {
    id: string;
    columnLabelFormat: IColumnLabelFormat | undefined;
    onClick?: () => void;
  }) => {
    const { styles, cx } = useStyles();
    const { style } = columnLabelFormat || DEFAULT_COLUMN_LABEL_FORMAT;

    const label = useMemo(() => {
      return formatLabel(id, columnLabelFormat, true);
    }, [columnLabelFormat, id]);

    const Icon = useMemo(() => ColumnTypeIcon[style], [style]);

    return (
      <div
        className={`flex items-center space-x-1.5 overflow-hidden whitespace-nowrap ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}>
        <div className={cx('flex', styles.icon)}>{Icon.icon}</div>
        <Text type="default" className="truncate">
          {label}
        </Text>
      </div>
    );
  }
);
SelectAxisItemLabel.displayName = 'SelectAxisItemLabel';

const useStyles = createStyles(({ css, token }) => ({
  icon: css`
    color: ${token.colorIcon};
  `
}));
