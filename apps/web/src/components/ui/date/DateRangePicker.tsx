import React, { type FC, useEffect, useRef, useState } from 'react';
import CheckIcon from '@/components/ui/icons/NucleoIconOutlined/check';
import ChevronDownIcon from '@/components/ui/icons/NucleoIconOutlined/chevron-down';
import ChevronUpIcon from '@/components/ui/icons/NucleoIconOutlined/chevron-up';
import { cn } from '@/lib/utils';
import { Button } from '../buttons';
import { Calendar } from '../calendar';
import { Label } from '../label';
import { PopoverBase, PopoverContent, PopoverTrigger } from '../popover/PopoverBase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select/SelectBase';
import { Switch } from '../switch';
import { DateInput } from './DateInput';

export interface DateRangePickerProps {
  /** Click handler for applying the updates from DateRangePicker. */
  onUpdate?: (values: { range: DateRange }) => void;
  /** Initial value for start date */
  initialDateFrom?: Date | string;
  /** Initial value for end date */
  initialDateTo?: Date | string;
  /** Alignment of popover */
  align?: 'start' | 'center' | 'end';
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** Option for locale */
  locale?: string;
  /** Disable dates before this date */
  disableDateBefore?: Date | string;
  /** Disable dates after this date */
  disableDateAfter?: Date | string;
}

const formatDate = (date: Date, locale: string = 'en-us'): string => {
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDateAdjustedForTimezone = (dateInput: Date | string): Date => {
  if (typeof dateInput === 'string') {
    // Split the date string to get year, month, and day parts
    const parts = dateInput.split('-').map((part) => parseInt(part, 10));
    // Create a new Date object using the local timezone
    // Note: Month is 0-indexed, so subtract 1 from the month part
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date;
  } else {
    // If dateInput is already a Date object, return it directly
    return dateInput;
  }
};

interface DateRange {
  from: Date;
  to: Date | undefined;
}

interface Preset {
  name: string;
  label: string;
}

// Define presets
const PRESETS: Preset[] = [
  { name: 'today', label: 'Today' },
  { name: 'yesterday', label: 'Yesterday' },
  { name: 'last7', label: 'Last 7 days' },
  { name: 'last14', label: 'Last 14 days' },
  { name: 'last30', label: 'Last 30 days' },
  { name: 'thisWeek', label: 'This Week' },
  { name: 'lastWeek', label: 'Last Week' },
  { name: 'thisMonth', label: 'This Month' },
  { name: 'lastMonth', label: 'Last Month' },
];

/** The DateRangePicker component allows a user to select a range of dates */
export const DateRangePicker: FC<DateRangePickerProps> = ({
  initialDateFrom = new Date(new Date().setHours(0, 0, 0, 0)),
  initialDateTo,
  onUpdate,
  side = 'bottom',
  align = 'start',
  locale = 'en-US',
  disableDateBefore,
  disableDateAfter,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [range, setRange] = useState<DateRange>({
    from: getDateAdjustedForTimezone(initialDateFrom),
    to: initialDateTo
      ? getDateAdjustedForTimezone(initialDateTo)
      : getDateAdjustedForTimezone(initialDateFrom),
  });

  // Refs to store the values of range and rangeCompare when the date picker is opened
  const openedRangeRef = useRef<DateRange | undefined>(undefined);

  const resetValues = (): void => {
    setRange({
      from:
        typeof initialDateFrom === 'string'
          ? getDateAdjustedForTimezone(initialDateFrom)
          : initialDateFrom,
      to: initialDateTo
        ? typeof initialDateTo === 'string'
          ? getDateAdjustedForTimezone(initialDateTo)
          : initialDateTo
        : typeof initialDateFrom === 'string'
          ? getDateAdjustedForTimezone(initialDateFrom)
          : initialDateFrom,
    });
  };

  // Helper function to check if two date ranges are equal
  const areRangesEqual = (a?: DateRange, b?: DateRange): boolean => {
    if (!a || !b) return a === b; // If either is undefined, return true if both are undefined
    return (
      a.from.getTime() === b.from.getTime() && (!a.to || !b.to || a.to.getTime() === b.to.getTime())
    );
  };

  useEffect(() => {
    if (isOpen) {
      openedRangeRef.current = range;
    }
  }, [isOpen]);

  return (
    <PopoverBase
      modal={true}
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          resetValues();
        }
        setIsOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outlined" suffix={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}>
          <div className="text-right">
            <div className="py-1">
              <div>{`${formatDate(range.from, locale)}${
                range.to != null ? ` - ${formatDate(range.to, locale)}` : ''
              }`}</div>
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} side={side} className="w-auto" size={'none'} sideOffset={8}>
        <DateRangePickerContent
          initialDateFrom={initialDateFrom}
          initialDateTo={initialDateTo}
          locale={locale}
          disableDateBefore={disableDateBefore}
          disableDateAfter={disableDateAfter}
          onUpdate={(_values) => {
            setIsOpen(false);
            onUpdate?.(_values);
          }}
          onCancel={() => {
            setIsOpen(false);
            resetValues();
          }}
        />
      </PopoverContent>
    </PopoverBase>
  );
};

DateRangePicker.displayName = 'DateRangePicker';

export interface DateRangePickerContentProps {
  /** Initial value for start date */
  initialDateFrom?: Date | string;
  /** Initial value for end date */
  initialDateTo?: Date | string;
  /** Option for locale */
  locale?: string;
  /** Disable dates before this date */
  disableDateBefore?: Date | string;
  /** Disable dates after this date */
  disableDateAfter?: Date | string;
  /** Callback when Update button is clicked */
  onUpdate?: (values: { range: DateRange }) => void;
  /** Callback when Cancel button is clicked */
  onCancel?: () => void;
}

export const DateRangePickerContent: FC<DateRangePickerContentProps> = ({
  initialDateFrom = new Date(new Date().setHours(0, 0, 0, 0)),
  initialDateTo,
  disableDateBefore,
  disableDateAfter,
  onUpdate,
  onCancel,
}) => {
  const [range, setRange] = useState<DateRange>({
    from: getDateAdjustedForTimezone(initialDateFrom),
    to: initialDateTo
      ? getDateAdjustedForTimezone(initialDateTo)
      : getDateAdjustedForTimezone(initialDateFrom),
  });

  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(undefined);

  const getPresetRange = (presetName: string): DateRange => {
    const preset = PRESETS.find(({ name }) => name === presetName);
    if (!preset) throw new Error(`Unknown date range preset: ${presetName}`);
    const from = new Date();
    const to = new Date();
    const first = from.getDate() - from.getDay();

    switch (preset.name) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - 1);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last7':
        from.setDate(from.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last14':
        from.setDate(from.getDate() - 13);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last30':
        from.setDate(from.getDate() - 29);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'thisWeek':
        from.setDate(first);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'lastWeek':
        from.setDate(from.getDate() - 7 - from.getDay());
        to.setDate(to.getDate() - to.getDay() - 1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        from.setMonth(from.getMonth() - 1);
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setDate(0);
        to.setHours(23, 59, 59, 999);
        break;
    }

    return { from, to };
  };

  const setPreset = (preset: string): void => {
    const range = getPresetRange(preset);
    setRange(range);
  };

  const checkPreset = (): void => {
    for (const preset of PRESETS) {
      const presetRange = getPresetRange(preset.name);

      const normalizedRangeFrom = new Date(range.from);
      normalizedRangeFrom.setHours(0, 0, 0, 0);
      const normalizedPresetFrom = new Date(presetRange.from.setHours(0, 0, 0, 0));

      const normalizedRangeTo = new Date(range.to ?? 0);
      normalizedRangeTo.setHours(0, 0, 0, 0);
      const normalizedPresetTo = new Date(presetRange.to?.setHours(0, 0, 0, 0) ?? 0);

      if (
        normalizedRangeFrom.getTime() === normalizedPresetFrom.getTime() &&
        normalizedRangeTo.getTime() === normalizedPresetTo.getTime()
      ) {
        setSelectedPreset(preset.name);
        return;
      }
    }

    setSelectedPreset(undefined);
  };

  useEffect(() => {
    checkPreset();
  }, [range]);

  const PresetButton = ({
    preset,
    label,
    isSelected,
  }: {
    preset: string;
    label: string;
    isSelected: boolean;
  }) => (
    <Button
      className={cn(isSelected && 'pointer-events-none')}
      variant="ghost"
      onClick={() => {
        setPreset(preset);
      }}
      prefix={isSelected ? <CheckIcon /> : undefined}
    >
      {label}
    </Button>
  );

  return (
    <>
      <div className="flex pt-2 items-center justify-space-around">
        <div className="flex">
          <div className="flex flex-col">
            <div className="flex flex-col justify-center items-center gap-2">
              <div className="flex gap-2">
                <DateInput
                  value={range.from}
                  onChange={(date) => {
                    const toDate = range.to == null || date > range.to ? date : range.to;
                    setRange((prevRange) => ({
                      ...prevRange,
                      from: date,
                      to: toDate,
                    }));
                  }}
                />
                <div className="py-1">-</div>
                <DateInput
                  value={range.to}
                  onChange={(date) => {
                    const fromDate = date < range.from ? date : range.from;
                    setRange((prevRange) => ({
                      ...prevRange,
                      from: fromDate,
                      to: date,
                    }));
                  }}
                />
              </div>
            </div>

            <div>
              <Calendar
                mode="range"
                onSelect={(value: { from?: Date; to?: Date } | undefined) => {
                  if (value?.from != null) {
                    setRange({ from: value.from, to: value?.to });
                  }
                }}
                selected={range}
                numberOfMonths={2}
                defaultMonth={new Date(new Date().setMonth(new Date().getMonth()))}
                disabled={(date) => {
                  if (disableDateBefore) {
                    const beforeDate = getDateAdjustedForTimezone(disableDateBefore);
                    beforeDate.setHours(0, 0, 0, 0);
                    if (date < beforeDate) return true;
                  }
                  if (disableDateAfter) {
                    const afterDate = getDateAdjustedForTimezone(disableDateAfter);
                    afterDate.setHours(23, 59, 59, 999);
                    if (date > afterDate) return true;
                  }
                  return false;
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 pr-0 pl-3 pb-3">
          {PRESETS.map((preset) => (
            <PresetButton
              key={preset.name}
              preset={preset.name}
              label={preset.label}
              isSelected={selectedPreset === preset.name}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 py-2 pr-4 border-t">
        <Button
          onClick={() => {
            onCancel?.();
          }}
          variant="ghost"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            onUpdate?.({ range });
          }}
        >
          Update
        </Button>
      </div>
    </>
  );
};
