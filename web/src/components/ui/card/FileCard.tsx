import { cn } from '@/lib/classMerge';
import React from 'react';
import { Text } from '../typography/Text';
import { Card, CardContent, CardFooter, CardHeader } from './CardBase';

interface FileCardProps {
  fileName?: string | React.ReactNode;
  headerButtons?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  bodyClassName?: string;
  footer?: React.ReactNode;
  footerClassName?: string;
}

export const FileCard = React.memo(
  ({
    fileName,
    className,
    headerButtons,
    children,
    bodyClassName,
    footer,
    footerClassName
  }: FileCardProps) => {
    const showHeader = !!fileName || !!headerButtons;

    return (
      <Card className={cn('h-full', className)}>
        {showHeader && (
          <CardHeader variant={'gray'} size={'xsmall'} className="justify-center">
            <div className="flex items-center justify-between gap-x-1">
              {typeof fileName === 'string' ? <Text truncate>{fileName}</Text> : fileName}
              <div className="flex items-center gap-1 whitespace-nowrap">{headerButtons}</div>
            </div>
          </CardHeader>
        )}

        <CardContent
          className={cn('bg-background relative h-full overflow-hidden p-0', bodyClassName)}>
          {children}
        </CardContent>

        {footer && (
          <CardFooter className={cn('bg-background px-4 py-2.5', footerClassName)}>
            {footer}
          </CardFooter>
        )}
      </Card>
    );
  }
);

FileCard.displayName = 'FileCard';
