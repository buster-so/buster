import { cn } from '@/lib/classMerge';
import Link from 'next/link';
import React from 'react';
import { ChevronLeft } from '../icons';
import { Button } from './Button';

interface BackButtonProps {
  onClick?: () => void;
  text?: string;
  size?: 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
  linkUrl?: string;
}

export const BackButton: React.FC<BackButtonProps> = React.memo(
  ({ onClick, text = 'Back', className = '', style, linkUrl }) => {
    return (
      <LinkWrapper linkUrl={linkUrl}>
        <Button
          prefix={
            <div className="group-hover:text-foreground flex text-xs">
              <ChevronLeft />
            </div>
          }
          variant="link"
          onClick={onClick}
          className={cn(className, 'group pl-1.5')}
          style={style}>
          {text}
        </Button>
      </LinkWrapper>
    );
  }
);

BackButton.displayName = 'BackButton';

const LinkWrapper: React.FC<{ children: React.ReactNode; linkUrl?: string }> = ({
  children,
  linkUrl
}) => {
  if (linkUrl) {
    return <Link href={linkUrl}>{children}</Link>;
  }
  return <>{children}</>;
};
