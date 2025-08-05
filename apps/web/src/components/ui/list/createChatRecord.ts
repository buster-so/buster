import { getNow, isDateAfter, isDateBefore, isDateSame } from '@/lib/date';

// Constraint type to ensure the date field contains a string value
type WithDateField<K extends string> = {
  [P in K]: string;
};

export const createChatRecord = <
  K extends string = 'last_edited',
  T extends WithDateField<K> = WithDateField<K>
>(
  data: T[],
  dateKey: K = 'last_edited' as K
): {
  TODAY: T[];
  YESTERDAY: T[];
  LAST_WEEK: T[];
  ALL_OTHERS: T[];
} => {
  const today = getNow();
  const yesterday = today.subtract(1, 'day');
  const weekStartDate = today.subtract(8, 'day').startOf('day');
  const twoDaysAgo = today.subtract(1, 'day').startOf('day');

  const TODAY: T[] = [];
  const YESTERDAY: T[] = [];
  const LAST_WEEK: T[] = [];
  const ALL_OTHERS: T[] = [];

  // Loop through the data array only once
  for (const item of data) {
    if (
      isDateSame({
        date: item[dateKey] as string,
        compareDate: today,
        interval: 'day'
      })
    ) {
      TODAY.push(item);
    } else if (
      isDateSame({
        date: item[dateKey] as string,
        compareDate: yesterday,
        interval: 'day'
      })
    ) {
      YESTERDAY.push(item);
    } else if (
      isDateAfter({
        date: item[dateKey] as string,
        compareDate: weekStartDate,
        interval: 'day'
      }) &&
      isDateBefore({
        date: item[dateKey] as string,
        compareDate: twoDaysAgo,
        interval: 'day'
      })
    ) {
      LAST_WEEK.push(item);
    } else {
      ALL_OTHERS.push(item);
    }
  }

  const result = {
    TODAY,
    YESTERDAY,
    LAST_WEEK,
    ALL_OTHERS
  };

  return result;
};
