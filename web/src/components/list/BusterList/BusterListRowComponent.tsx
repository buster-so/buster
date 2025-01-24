import { useMemoizedFn } from 'ahooks';
import get from 'lodash/get';
import React, { useMemo } from 'react';
import { BusterListRow, BusterListColumn, BusterListRowItem, BusterListProps } from './interfaces';
import Link from 'next/link';
import { CheckboxColumn } from './CheckboxColumn';
import { createStyles } from 'antd-style';
import { HEIGHT_OF_ROW, sizes } from './config';

export const BusterListRowComponent = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      row: BusterListRow;
      columns: BusterListColumn[];
      checked: boolean;
      onSelectChange?: (v: boolean, id: string) => void;
      onContextMenuClick?: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
      style?: React.CSSProperties;
      columnRowVariant: BusterListProps['columnRowVariant'];
      useRowClickSelectChange: boolean;
      rowClassName?: string;
      isLastChild: boolean;
    }
  >(
    (
      {
        style,
        columnRowVariant,
        row,
        columns,
        onSelectChange,
        checked,
        onContextMenuClick,
        rowClassName = '',
        isLastChild,
        useRowClickSelectChange
      },
      ref
    ) => {
      const { styles, cx } = useStyles();
      const link = row.link;

      const onContextMenu = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
        onContextMenuClick?.(e, row.id);
      });

      const onChange = useMemoizedFn((newChecked: boolean) => {
        onSelectChange?.(newChecked, row.id);
      });

      const onContainerClick = useMemoizedFn(() => {
        if (useRowClickSelectChange) {
          onChange(!checked);
        }
        row.onClick?.();
      });

      return (
        <LinkWrapper href={link}>
          <div
            onClick={onContainerClick}
            style={style}
            onContextMenu={onContextMenu}
            className={cx(
              styles.row,
              rowClassName,
              'group flex items-center pr-6',
              checked ? 'checked' : '',
              columnRowVariant,
              isLastChild ? 'last-child' : '',
              !onSelectChange ? 'pl-3.5' : '',

              { clickable: !!(link || row.onClick || (onSelectChange && useRowClickSelectChange)) }
            )}
            ref={ref}>
            {!!onSelectChange ? (
              <CheckboxColumn checkStatus={checked ? 'checked' : 'unchecked'} onChange={onChange} />
            ) : (
              <></>
            )}
            {columns.map((column, columnIndex) => (
              <BusterListCellComponent
                key={column.dataIndex}
                data={get(row.data, column.dataIndex)}
                row={row}
                render={column.render}
                isFirstCell={columnIndex === 0}
                isLastCell={columnIndex === columns.length - 1}
                width={column.width}
                onSelectChange={onSelectChange}
              />
            ))}
          </div>
        </LinkWrapper>
      );
    }
  )
);
BusterListRowComponent.displayName = 'BusterListRowComponent';

const BusterListCellComponent: React.FC<{
  data: string | number | React.ReactNode;
  row: BusterListRowItem['data'];
  isFirstCell?: boolean;
  isLastCell?: boolean;
  width?: number | undefined;
  onSelectChange?: (v: boolean, id: string) => void;
  render?: (data: string | number | React.ReactNode, row: BusterListRowItem) => React.ReactNode;
}> = React.memo(({ data, width, row, render, isFirstCell, isLastCell, onSelectChange }) => {
  const { styles, cx } = useStyles();

  const memoizedStyle = useMemo(() => {
    return {
      width: width || '100%',
      flex: width ? 'none' : 1
    };
  }, [width, isLastCell, onSelectChange]);

  return (
    <div
      className={cx(styles.cell, 'row-cell flex items-center overflow-hidden', {
        secondary: !isFirstCell
      })}
      style={memoizedStyle}>
      <div className="w-full truncate">{render ? render(data, row?.data) : data}</div>
    </div>
  );
});
BusterListCellComponent.displayName = 'BusterListCellComponent';

const LinkWrapper: React.FC<{
  href?: string;
  children: React.ReactNode;
}> = ({ href, children }) => {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} prefetch={true}>
      {children}
    </Link>
  );
};

export const useStyles = createStyles(({ css, token }) => ({
  row: css`
    height: ${HEIGHT_OF_ROW}px;
    min-height: ${HEIGHT_OF_ROW}px;
    border-bottom: 0.5px solid ${token.colorBorder};

    &.clickable {
      cursor: pointer;

      &:hover {
        background-color: ${token.controlItemBgHover};
      }
    }

    .row-cell {
      padding: 0 4px;
      display: flex;
      align-items: center;
      height: 100%;
    }

    &.checked {
      background-color: ${token.colorPrimaryBg};
      &:hover {
        background-color: ${token.colorPrimaryBgHover};
      }
    }

    &.containerized:not(.checked) {
      background-color: ${token.colorBgContainer};

      &.clickable {
        &:hover {
          background-color: ${token.controlItemBgHover};
        }
      }

      &.last-child {
        border-bottom: 0px;
      }
    }
  `,
  cell: css`
    color: ${token.colorText};
    font-size: ${sizes.base};

    &.secondary {
      color: ${token.colorTextTertiary};
      font-size: ${sizes.sm};
    }
  `
}));
