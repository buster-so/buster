import { createStyles } from 'antd-style';
import React, { useRef } from 'react';
import { ChartWrapperProvider } from './chartHooks';
import { useSize } from 'ahooks';

export const BusterChartWrapper = React.memo<{
  children: React.ReactNode;
  id: string | undefined;
  className: string | undefined;
  bordered: boolean;
  loading: boolean;
  useTableSizing: boolean;
}>(({ children, id, className, bordered, loading, useTableSizing }) => {
  const { styles, cx } = useStyles();
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);
  const width = size?.width ?? 400;

  return (
    <ChartWrapperProvider width={width}>
      <div
        ref={ref}
        id={id}
        className={cx(
          styles.card,
          className,
          'flex w-full flex-col',
          'transition duration-300',
          useTableSizing ? 'h-full' : 'h-full max-h-[600px] p-[18px]',
          bordered ? styles.cardBorder : '',
          loading ? '!bg-transparent' : undefined,
          'overflow-hidden'
        )}>
        {children}
      </div>
    </ChartWrapperProvider>
  );
});

BusterChartWrapper.displayName = 'BusterChartWrapper';

const useStyles = createStyles(({ token }) => {
  return {
    card: {
      borderRadius: token.borderRadius,
      background: token.colorBgContainer
    },
    cardBorder: {
      border: `0.5px solid ${token.colorBorder}`
    }
  };
});
