'use client';
import React from 'react';
import { AppMaterialIcons } from '../icons';
import { createStyles } from 'antd-style';
import { Title } from '../text';
import Link from 'next/link';

interface BackButtonProps {
  onClick?: () => void;
  text?: string;
  size?: 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
  type?: 'default' | 'secondary' | 'tertiary';
  linkUrl?: string;
}

export const BackButton: React.FC<BackButtonProps> = React.memo(
  ({
    onClick,
    text = 'Back',
    size = 'medium',
    className = '',
    style,
    type = 'secondary',
    linkUrl
  }) => {
    const { styles, cx } = useStyles();
    const titleSize = size === 'large' ? 4 : 5;

    return (
      <LinkWrapper linkUrl={linkUrl}>
        <div className={cx('group', styles.container, className)} style={style}>
          <div className={cx('flex cursor-pointer items-center space-x-2.5')} onClick={onClick}>
            <AppMaterialIcons
              className={cx(styles.icon, 'group-hover:text-black dark:group-hover:text-white')}
              icon="chevron_left"
            />

            <Title type={type} level={titleSize} clickable>
              {text}
            </Title>
          </div>
        </div>
      </LinkWrapper>
    );
  }
);

BackButton.displayName = 'BackButton';

const LinkWrapper = ({ children, linkUrl }: { children: React.ReactNode; linkUrl?: string }) => {
  if (linkUrl) {
    return <Link href={linkUrl}>{children}</Link>;
  }
  return <>{children}</>;
};

const useStyles = createStyles(({ css, token }) => ({
  icon: {
    color: token.colorIcon
  },
  container: css`
    &:hover {
      color: ${token.colorText};
    }
  `
}));
