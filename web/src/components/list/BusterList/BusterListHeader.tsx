import React from 'react';
import { BusterListColumn } from './interfaces';
import { CheckboxColumn } from './CheckboxColumn';
import { Text } from '@/components/text';
import { createStyles } from 'antd-style';
import { HEIGHT_OF_HEADER } from './config';

export const BusterListHeader: React.FC<{
  columns: BusterListColumn[];
  onGlobalSelectChange?: (v: boolean) => void;
  globalCheckStatus?: 'checked' | 'unchecked' | 'indeterminate';
  showSelectAll?: boolean;
  rowsLength: number;
}> = React.memo(
  ({ columns, showSelectAll = true, onGlobalSelectChange, globalCheckStatus, rowsLength }) => {
    const { styles, cx } = useStyles();
    const showCheckboxColumn = !!onGlobalSelectChange;
    const showGlobalCheckbox =
      globalCheckStatus === 'indeterminate' || globalCheckStatus === 'checked';

    return (
      <div className={cx(styles.header, 'group')}>
        {showCheckboxColumn && (
          <CheckboxColumn
            checkStatus={globalCheckStatus}
            onChange={onGlobalSelectChange}
            className={cx({
              'opacity-100': showGlobalCheckbox,
              '!invisible': rowsLength === 0,
              'pointer-events-none !invisible': !showSelectAll
            })}
          />
        )}

        {columns.map((column, index) => (
          <div
            className={cx('header-cell flex items-center', {
              '!pl-[14px]': !onGlobalSelectChange
            })}
            key={column.dataIndex}
            style={{
              width: column.width || '100%',
              flex: column.width ? 'none' : 1,
              marginRight: index === columns.length - 1 ? '24px' : undefined
            }}>
            {column.headerRender ? (
              column.headerRender(column.title)
            ) : (
              <Text size="sm" type="secondary" ellipsis>
                {column.title}
              </Text>
            )}
          </div>
        ))}
      </div>
    );
  }
);
BusterListHeader.displayName = 'BusterListHeader';

const useStyles = createStyles(({ token, css }) => ({
  header: css`
    height: ${HEIGHT_OF_HEADER}px;
    min-height: ${HEIGHT_OF_HEADER}px;
    display: flex;
    align-items: center;
    justify-content: flex-start;

    border-bottom: 0.5px solid ${token.colorBorder};

    .header-cell {
      padding: 0 4px;
      height: 100%;

      &:first-child {
        padding-left: 18px;
      }
    }
  `
}));
