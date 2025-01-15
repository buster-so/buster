import React, { useMemo } from 'react';
import { Text } from '@/components/text';
import { BusterListRow } from './interfaces';
import { useMemoizedFn } from 'ahooks';
import { CheckboxColumn } from './CheckboxColumn';
import { getAllIdsInSection } from './helpers';
import { createStyles } from 'antd-style';
import { HEIGHT_OF_SECTION_ROW } from './config';

export const BusterListSectionComponent = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      rowSection: NonNullable<BusterListRow['rowSection']>;
      onSelectSectionChange?: (v: boolean, id: string) => void;
      id: string;
      selectedRowKeys?: string[];
      rows: BusterListRow[];
      style?: React.CSSProperties;
    }
  >(({ rowSection, onSelectSectionChange, id, selectedRowKeys, rows, style }, ref) => {
    const { styles, cx } = useStyles();

    const indexOfSection = useMemo(() => {
      return rows.findIndex((row) => row.id === id);
    }, [rows.length, id]);

    const idsInSection = useMemo(() => {
      return getAllIdsInSection(rows, id);
    }, [rows.length, id]);

    const checkStatus = useMemo(() => {
      if (!selectedRowKeys) return 'unchecked';
      if (rowSection.disableSection) return 'unchecked';
      if (selectedRowKeys?.length === 0) return 'unchecked';

      const allIdsSelected = idsInSection.every((id) => selectedRowKeys.includes(id));
      if (allIdsSelected) return 'checked';
      const someIdsSelected = idsInSection.some((id) => selectedRowKeys.includes(id));
      if (someIdsSelected) return 'indeterminate';
      return 'unchecked';
    }, [selectedRowKeys?.length, idsInSection, indexOfSection, rowSection]);

    const onChange = useMemoizedFn((checked: boolean) => {
      onSelectSectionChange?.(checked, id);
    });

    return (
      <div
        className={cx(
          styles.sectionRow,
          'group flex items-center',
          !!onSelectSectionChange && 'hoverable'
        )}
        style={style}
        ref={ref}>
        {onSelectSectionChange && <CheckboxColumn checkStatus={checkStatus} onChange={onChange} />}

        <div
          className={cx(
            'flex items-center space-x-2 leading-none',
            !onSelectSectionChange && 'ml-3.5',
            onSelectSectionChange && 'pl-[4px]'
          )}>
          <Text size="sm">{rowSection.title}</Text>
          <Text size="sm" type="tertiary">
            {rowSection.secondaryTitle}
          </Text>
        </div>
      </div>
    );
  })
);
BusterListSectionComponent.displayName = 'BusterListSectionComponent';

export const useStyles = createStyles(({ css, token }) => ({
  sectionRow: css`
    height: ${HEIGHT_OF_SECTION_ROW}px;
    min-height: ${HEIGHT_OF_SECTION_ROW}px;
    background-color: ${token.controlItemBgActive};

    .hoverable {
      &:hover {
        background-color: ${token.controlItemBgActiveHover};
      }
    }
  `
}));
