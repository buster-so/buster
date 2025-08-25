import React, { useMemo } from 'react';
import { formatDate } from '@/lib/date';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { Paragraph } from '@/components/ui/typography/Paragraph';
import { cn } from '@/lib/utils';

const DEFAULT_CREATED_BY = 'Created by Buster';

export const ReportPageHeader = React.forwardRef<
  HTMLInputElement,
  {
    className?: string;
    name?: string;
    updatedAt?: string;
    onChangeName: (name: string) => void;
    isStreaming: boolean;
  }
>(({ name = '', updatedAt = '', className = '', onChangeName, isStreaming }, ref) => {
  const updatedAtFormatted = useMemo(() => {
    if (!updatedAt) return '';
    return formatDate({ date: updatedAt, format: 'll' });
  }, [updatedAt]);

  return (
    <div className={cn('flex flex-col space-y-1.5', className)}>
      <EditableTitle
        readOnly={isStreaming}
        className="text-foreground! h-9"
        level={1}
        ref={ref}
        onChange={onChangeName}>
        {name}
      </EditableTitle>
      <Paragraph size={'base'} variant={'tertiary'} className="select-none">
        <span className="select-text">{updatedAtFormatted}</span>
        <span className="select-none"> • </span>
        <span className="select-text">{DEFAULT_CREATED_BY}</span>
      </Paragraph>
    </div>
  );
});

ReportPageHeader.displayName = 'ReportPageHeader';
