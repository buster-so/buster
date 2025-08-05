'use client';

import type * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from '../icons';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          'h-7 w-7 bg-transparent p-0 opacity-50 cursor-pointer hover:opacity-100 rounded flex items-center justify-center hover:bg-item-hover'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-gray-light rounded-md w-8 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-item-select [&:has([aria-selected].day-outside)]:bg-item-select/50 [&:has([aria-selected].day-range-end)]:rounded-r-md',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md'
        ),
        day: cn(
          'h-8 w-8 p-0 cursor-pointer font-normal aria-selected:opacity-100 hover:bg-item-hover rounded flex items-center justify-center'
        ),
        day_range_start: 'day-range-start',
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary   text-background hover:bg-primary hover:text-background focus:bg-primary focus:text-background',
        day_today: 'bg-item-select text-accent-foreground',
        day_outside:
          'day-outside text-gray-light aria-selected:bg-item-select/50 aria-selected:text-gray-light ',
        day_disabled: 'text-gray-light opacity-50 cursor-not-allowed!',
        day_range_middle: 'aria-selected:bg-item-select aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <div className={cn(className)} {...props}>
            <ChevronLeft />
          </div>
        ),
        IconRight: ({ className, ...props }) => (
          <div className={cn(className)} {...props}>
            <ChevronRight />
          </div>
        )
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
