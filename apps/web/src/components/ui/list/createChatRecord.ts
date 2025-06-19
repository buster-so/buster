import { getNow, isDateAfter, isDateBefore, isDateSame } from '@/lib/date';

type ListItem = {
  id: string;
  last_edited: string;
};

export const createChatRecord = <T extends ListItem>(
  data: T[]
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
        date: item.last_edited,
        compareDate: today,
        interval: 'day'
      })
    ) {
      TODAY.push(item);
    } else if (
      isDateSame({
        date: item.last_edited,
        compareDate: yesterday,
        interval: 'day'
      })
    ) {
      YESTERDAY.push(item);
    } else if (
      isDateAfter({
        date: item.last_edited,
        compareDate: weekStartDate,
        interval: 'day'
      }) &&
      isDateBefore({
        date: item.last_edited,
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
