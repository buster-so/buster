'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from '@/components/ui/icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/buttons';
import { Calendar } from '@/components/ui/calendar';
import {
  PopoverRoot as Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover/PopoverBase';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function DateTimePicker() {
  const [date, setDate] = React.useState<Date>();
  const [isOpen, setIsOpen] = React.useState(false);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute' | 'ampm', value: string) => {
    if (date) {
      const newDate = new Date(date);
      if (type === 'hour') {
        newDate.setHours((Number.parseInt(value) % 12) + (newDate.getHours() >= 12 ? 12 : 0));
      } else if (type === 'minute') {
        newDate.setMinutes(Number.parseInt(value));
      } else if (type === 'ampm') {
        const currentHours = newDate.getHours();
        newDate.setHours(value === 'PM' ? currentHours + 12 : currentHours - 12);
      }
      setDate(newDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn('w-full justify-start text-left font-normal', !date && 'text-gray-light')}>
          <div className="mr-2 h-4 w-4">
            <CalendarIcon />
          </div>
          {date ? format(date, 'MM/dd/yyyy hh:mm aa') : <span>MM/DD/YYYY hh:mm aa</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
          <div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex p-2 sm:flex-col">
                {hours.reverse().map((hour) => (
                  <Button
                    key={hour}
                    size="small"
                    variant={date && date.getHours() % 12 === hour % 12 ? 'default' : 'ghost'}
                    className="aspect-square shrink-0 sm:w-full"
                    onClick={() => handleTimeChange('hour', hour.toString())}>
                    {hour}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex p-2 sm:flex-col">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="small"
                    variant={date && date.getMinutes() === minute ? 'default' : 'ghost'}
                    className="aspect-square shrink-0 sm:w-full"
                    onClick={() => handleTimeChange('minute', minute.toString())}>
                    {minute}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="">
              <div className="flex p-2 sm:flex-col">
                {['AM', 'PM'].map((ampm) => (
                  <Button
                    key={ampm}
                    size="small"
                    variant={
                      date &&
                      ((ampm === 'AM' && date.getHours() < 12) ||
                        (ampm === 'PM' && date.getHours() >= 12))
                        ? 'default'
                        : 'ghost'
                    }
                    className="aspect-square shrink-0 sm:w-full"
                    onClick={() => handleTimeChange('ampm', ampm)}>
                    {ampm}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
