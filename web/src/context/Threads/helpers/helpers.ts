import { BusterThreadListItem } from '@/api/buster_rest';
import isEmpty from 'lodash/isEmpty';
import { BusterMessageData, IBusterThread, IBusterThreadMessage } from '../interfaces';
import { isNumericColumnType } from '@/utils';
import { defaultIBusterThread } from '../config';
import { BusterChartConfigProps } from '@/components/charts';

export const threadsArrayToRecord = (threads: BusterThreadListItem[]) => {
  return threads.reduce(
    (acc, thread) => {
      acc[thread.id] = thread;
      return acc;
    },
    {} as Record<string, BusterThreadListItem>
  );
};

export const canEditChart = (
  threadId: string | undefined | null,
  messageData: BusterMessageData,
  columnLabelFormats: BusterChartConfigProps['columnLabelFormats']
): boolean => {
  return (
    !!threadId &&
    !messageData?.fetchingData &&
    !!messageData?.retrievedData &&
    !isEmpty(messageData?.data) &&
    !columnLabelFormats &&
    !!Object.values(columnLabelFormats! || {}).some((column) =>
      isNumericColumnType(column.columnType)
    )
  );
};

export const resolveEmptyThread = (thread: IBusterThread, threadId: string): IBusterThread => {
  if (!thread || !thread?.id) {
    return { ...defaultIBusterThread, id: threadId };
  }
  return thread;
};
