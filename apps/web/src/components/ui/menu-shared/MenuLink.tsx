import { Link, type LinkProps, type RegisteredRouter } from '@tanstack/react-router';
import * as React from 'react';
import { cn } from '@/lib/classMerge';
import type { ILinkProps } from '@/types/routes';
import { Button } from '../buttons/Button';
import { CaretRight } from '../icons/NucleoIconFilled';
import { ArrowRight, ArrowUpRight } from '../icons/NucleoIconOutlined';
import type { MenuItem } from './menu-items.types';

export const MenuLink = <
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>({
  className,
  link,
  linkTarget,
  linkIcon = 'arrow-right',
}: {
  className?: string;
  link: string | ILinkProps<TRouter, TOptions, TFrom> | null | undefined;
  linkIcon?: MenuItem['linkIcon'];
  linkTarget?: '_blank' | '_self';
}) => {
  const icon = React.useMemo(() => {
    if (linkIcon === 'arrow-right') return <ArrowRight />;
    if (linkIcon === 'arrow-external') return <ArrowUpRight />;
    if (linkIcon === 'caret-right') return <CaretRight />;
    if (linkIcon === 'none') return null;
  }, [linkIcon]);

  const isExternal = typeof link === 'string' && link.startsWith('http');

  const content = (
    <Button
      prefix={icon}
      variant="ghost"
      size="small"
      rounding={'default'}
      className={cn('text-gray-dark hover:bg-gray-dark/8')}
    />
  );

  if (!link)
    return (
      <div
        className={className}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    );
  const target = linkTarget || (isExternal ? '_blank' : '_self');

  const linkContent =
    typeof link === 'string' ? (
      <a href={link} target={target} className={className}>
        {content}
      </a>
    ) : (
      <Link {...(link as LinkProps)} target={target} preload="intent" className={className}>
        {content}
      </Link>
    );

  return (
    <div
      className={className}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {linkContent}
    </div>
  );
};
MenuLink.displayName = 'MenuLink';
