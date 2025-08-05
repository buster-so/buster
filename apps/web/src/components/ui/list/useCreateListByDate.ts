import { useMemo } from 'react';
import { createChatRecord } from './createChatRecord';

// Constraint type to ensure the date field contains a string value
type WithDateField<K extends string> = {
  [P in K]: string;
};

export const useCreateListByDate = <
  K extends string = 'last_edited',
  T extends WithDateField<K> = WithDateField<K>
>({
  data,
  dateKey = 'last_edited' as K
}: {
  data: T[];
  dateKey?: K;
}) => {
  return useMemo(() => createChatRecord(data, dateKey), [data, dateKey]);
};
