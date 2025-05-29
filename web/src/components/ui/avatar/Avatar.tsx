import React from 'react';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { getFirstTwoCapitalizedLetters } from '@/lib/text';
import { cn } from '@/lib/utils';
import { Tooltip } from '../tooltip/Tooltip';
import { Avatar as AvatarBase, AvatarFallback, AvatarImage } from './AvatarBase';

export interface AvatarProps {
  image?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  useToolTip?: boolean;
  size?: number;
  tooltipTitle?: string | React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = React.memo(
  ({ image, name, className, useToolTip = true, size, fallbackClassName, tooltipTitle }) => {
    const hasName = !!name;
    const nameLetters = createNameLetters(name);
    const hasImage = !!image;

    return (
      <Tooltip delayDuration={300} title={useToolTip ? tooltipTitle || name || '' : ''}>
        <AvatarBase
          className={className}
          style={{
            width: size,
            height: size
          }}>
          {image && <AvatarImage src={image} />}
          {hasName ? (
            <NameLettersFallback
              fallbackClassName={fallbackClassName}
              nameLetters={nameLetters}
              hasImage={hasImage}
            />
          ) : (
            <BusterAvatarFallback fallbackClassName={fallbackClassName} />
          )}
        </AvatarBase>
      </Tooltip>
    );
  }
);
Avatar.displayName = 'Avatar';

const NameLettersFallback: React.FC<{
  fallbackClassName?: string;
  nameLetters: string;
  hasImage: boolean;
}> = ({ fallbackClassName, hasImage, nameLetters }) => {
  return (
    <AvatarFallback className={cn(fallbackClassName)} delayMs={hasImage ? 300 : 0}>
      {nameLetters}
    </AvatarFallback>
  );
};

const BusterAvatarFallback: React.FC<{ fallbackClassName?: string }> = ({ fallbackClassName }) => {
  return (
    <AvatarFallback className={cn('border bg-white', fallbackClassName)} delayMs={0}>
      <div className="text-foreground flex h-full w-full items-center justify-center">
        <BusterLogo className="h-full w-full translate-x-[1px] p-1" />
      </div>
    </AvatarFallback>
  );
};

const createNameLetters = (name?: string | null) => {
  if (name) {
    const firstTwoLetters = getFirstTwoCapitalizedLetters(name);
    if (firstTwoLetters.length === 2) return firstTwoLetters;

    const _name = name.split(' ') as [string, string];
    const returnName = `${_name[0][0]}`.toUpperCase().replace('@', '');

    return returnName;
  }
  return '';
};
