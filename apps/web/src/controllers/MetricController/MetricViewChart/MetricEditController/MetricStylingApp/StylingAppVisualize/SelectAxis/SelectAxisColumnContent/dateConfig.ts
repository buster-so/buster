import { formatDate } from '@/lib';

const NO_FORMATTING_ID = 'NO_FORMATTING_👻';
export const NO_FORMATTING_ITEM = {
  label: 'No formatting',
  value: NO_FORMATTING_ID
};

export const getDefaultDateOptions = (now: Date) => {
  return [
    {
      label: 'Auto Format',
      value: 'auto'
    },
    NO_FORMATTING_ITEM,
    {
      label: formatDate({
        date: now,
        format: 'l'
      }),
      value: 'l'
    },
    {
      label: formatDate({
        date: now,
        format: 'll'
      }),
      value: 'll'
    },
    {
      label: formatDate({
        date: now,
        format: 'lll'
      }),
      value: 'lll'
    },
    {
      label: formatDate({
        date: now,
        format: 'llll'
      }),
      value: 'llll'
    },
    {
      label: formatDate({
        date: now,
        format: 'LL'
      }),
      value: 'LL'
    },
    {
      label: formatDate({
        date: now,
        format: 'LLL'
      }),
      value: 'LLL'
    },
    {
      label: formatDate({
        date: now,
        format: 'LLLL'
      }),
      value: 'LLLL'
    },
    {
      label: formatDate({
        date: now,
        format: 'LTS'
      }),
      value: 'LTS'
    },

    {
      label: formatDate({
        date: now,
        format: 'M/D'
      }),
      value: 'M/D'
    },
    {
      label: formatDate({
        date: now,
        format: 'M/D/YYYY h:mm A'
      }),
      value: 'M/D/YYYY h:mm A'
    },
    {
      label: formatDate({
        date: now,
        format: 'MMMM'
      }),
      value: 'MMMM'
    },
    {
      label: formatDate({
        date: now,
        format: 'MMM'
      }),
      value: 'MMM'
    },
    {
      label: formatDate({
        date: now,
        format: 'MMM D'
      }),
      value: 'MMM D'
    },
    {
      label: formatDate({
        date: now,
        format: 'MMMM D'
      }),
      value: 'MMMM D'
    },
    {
      label: formatDate({
        date: now,
        format: 'MM/YYYY'
      }),
      value: 'MM/YYYY'
    },
    {
      label: formatDate({
        date: now,
        format: 'dddd, MMMM D'
      }),
      value: 'dddd, MMMM D'
    },
    {
      label: formatDate({
        date: now,
        format: 'h:mm A'
      }),
      value: 'h:mm A'
    },
    {
      label: formatDate({
        date: now,
        format: 'h:mm:ss A'
      }),
      value: 'h:mm:ss A'
    }
  ];
};

export const getDefaultDayOfWeekOptions = (now: Date) => {
  return [
    {
      label: 'Auto Format',
      value: 'auto'
    },
    NO_FORMATTING_ITEM,
    {
      label: formatDate({
        date: now,
        format: 'dddd'
      }),
      value: 'dddd'
    },
    {
      label: formatDate({
        date: now,
        format: 'ddd'
      }),
      value: 'ddd'
    },
    {
      label: formatDate({
        date: now,
        format: 'd'
      }),
      value: 'd'
    }
  ];
};

export const getDefaultMonthOptions = (now: Date) => {
  return [
    {
      label: 'Auto Format',
      value: 'auto'
    },
    NO_FORMATTING_ITEM,
    {
      label: formatDate({
        date: now,
        format: 'MMMM'
      }),
      value: 'MMMM'
    },
    {
      label: formatDate({
        date: now,
        format: 'MMM'
      }),
      value: 'MMM'
    },
    {
      label: formatDate({
        date: now,
        format: 'M'
      }),
      value: 'M'
    }
  ];
};

export const getDefaultQuarterOptions = (now: Date) => {
  return [
    {
      label: 'Auto Format',
      value: 'auto'
    },
    NO_FORMATTING_ITEM,
    { label: formatDate({ date: now, format: 'YYYY [Q]Q' }), value: 'YYYY [Q]Q' },
    { label: formatDate({ date: now, format: 'Q' }), value: 'Q' }
  ];
};
