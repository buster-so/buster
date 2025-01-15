import React, { useMemo } from 'react';
import { SidebarStylingAppSegments } from './config';
import { SegmentedOptions, SegmentedValue } from 'antd/es/segmented';
import { useMemoizedFn } from 'ahooks';
import { Segmented } from 'antd';
import { createStyles } from 'antd-style';
import { IBusterThreadMessageChartConfig } from '@/api/buster-rest';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    border-bottom: 0.5px solid ${token.colorBorder};
  `
}));

export const SidebarStylingAppSegment: React.FC<{
  segment: SidebarStylingAppSegments;
  setSegment: (segment: SidebarStylingAppSegments) => void;
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  className?: string;
}> = React.memo(({ segment, setSegment, selectedChartType, className = '' }) => {
  const { cx, styles } = useStyles();
  const isTable = selectedChartType === 'table';
  const isMetric = selectedChartType === 'metric';
  const disableColors = isTable || isMetric;
  const disableStyling = isTable || isMetric;

  const options: SegmentedOptions = useMemo(
    () => [
      {
        label: SidebarStylingAppSegments.VISUALIZE,
        value: SidebarStylingAppSegments.VISUALIZE
      },
      {
        label: SidebarStylingAppSegments.STYLING,
        value: SidebarStylingAppSegments.STYLING,
        disabled: disableStyling
      },
      {
        label: SidebarStylingAppSegments.COLORS,
        value: SidebarStylingAppSegments.COLORS,
        disabled: disableColors
      }
    ],
    [disableColors, disableStyling]
  );

  const onChangeSegment = useMemoizedFn((value: SegmentedValue) => {
    setSegment(value as SidebarStylingAppSegments);
  });

  return (
    <div className={cx(styles.container)}>
      <div className={cx('pb-3', className)}>
        <Segmented block options={options} value={segment} onChange={onChangeSegment} />
      </div>
    </div>
  );
});
SidebarStylingAppSegment.displayName = 'SidebarStylingAppSegment';
