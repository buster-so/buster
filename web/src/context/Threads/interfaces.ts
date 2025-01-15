import {
  BusterThought,
  BusterThread,
  BusterThreadMessage,
  IBusterThreadMessageChartConfig
} from '@/api/buster-rest';

export interface IBusterThread extends Omit<BusterThread, 'messages'> {
  isNewThread: boolean; //used when the thread is first created and it is streaming in, will toggle to false when the thread is done loading
  isFollowupMessage: boolean; //used when the thread is a followup message, will toggle to false when the thread is done loading
  isInitialLoad: boolean; //used when the thread is first loaded, page refresh
  messages: string[];
}

export interface IBusterThreadMessage extends Omit<BusterThreadMessage, 'chart_config'> {
  thoughts: {
    completed: boolean;
  } & BusterThreadMessage['thoughts'];
  isCompleted: boolean;
  chart_config: IBusterThreadMessageChartConfig;
}

export interface BusterMessageData {
  data?: Record<string, null | string | number>[] | null;
  dataFromRerun?: Record<string, string | number | null>[] | null;
  retrievedData: boolean;
  fetchingData: boolean;
  updatedAt: number;
  data_metadata: BusterThreadMessage['data_metadata'];
  code: string | null;
}
