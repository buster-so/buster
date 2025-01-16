'use client';

import React, { PropsWithChildren } from 'react';

import { Layout } from 'antd';
import { createStyles } from 'antd-style';
import { appContentHeaderHeight } from './AppContentHeader';
const { Content } = Layout;

const useStyles = createStyles(({ css }) => {
  return {
    scrollableContainer: css`
      max-height: calc(100% - ${appContentHeaderHeight}px);
      overflow-y: auto;
    `
  };
});

export const AppContent: React.FC<
  PropsWithChildren<{
    className?: string;
    scrollable?: boolean;
  }>
> = React.memo(({ scrollable, className = 'overflow-y-auto', children }) => {
  const { styles, cx } = useStyles();

  return (
    <Content className={cx(className, scrollable && styles.scrollableContainer)}>
      {children}
    </Content>
  );
});
AppContent.displayName = 'AppContent';
