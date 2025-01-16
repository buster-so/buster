'use client';

import React, { PropsWithChildren } from 'react';
import { Layout } from 'antd';
import { createStyles } from 'antd-style';

export const appContentHeaderHeight = 38;

const useStyles = createStyles(({ token }) => ({
  header: {
    borderBottom: `0.5px solid${token.colorBorder}`,
    height: appContentHeaderHeight
  }
}));

export const AppContentHeader: React.FC<
  PropsWithChildren<{
    className?: string;
  }>
> = React.memo(({ children, className = '' }) => {
  const { cx, styles } = useStyles();

  return (
    <Layout.Header className={cx(`flex h-full w-full items-center`, className, styles.header)}>
      {children}
    </Layout.Header>
  );
});
AppContentHeader.displayName = 'AppContentHeader';
