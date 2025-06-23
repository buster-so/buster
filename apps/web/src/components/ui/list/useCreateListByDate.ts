import { useMemo } from 'react';
import { createChatRecord } from './createChatRecord';

type ListItem = {
  id: string;
  last_edited: string;
};

export const useCreateListByDate = <T extends ListItem>({ data }: { data: T[] }) => {
  return useMemo(() => createChatRecord(data), [data]);
};
