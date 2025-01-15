'use client';

import { AppMaterialIcons } from '@/components';
import React from 'react';

import { createStyles } from 'antd-style';
import Link from 'next/link';
import { Text } from '@/components';

const useStyles = createStyles(({ css, token }) => ({
  icon: {
    color: token.colorIcon
  }
}));

export const HeaderContainer: React.FC<{
  buttonText: string;
  linkUrl: string;
  onClick?: () => void;
}> = ({ onClick, linkUrl, buttonText }) => {
  const { styles, cx } = useStyles();

  return (
    <Link href={linkUrl} className="mb-3" onClick={onClick}>
      <div className={cx('flex cursor-pointer items-center space-x-2', styles.icon)}>
        <AppMaterialIcons icon="chevron_left" />
        <Text type="secondary">{buttonText}</Text>
      </div>
    </Link>
  );
};
