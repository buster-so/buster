import {
  BusterThread,
  BusterThreadListItem,
  BusterThreadSearchItem,
  BusterThreadStepEvent_FetchingData,
  BusterThreadStepEvent_FixingSql,
  BusterThreadStepEvent_GeneratingDescription,
  BusterThreadStepEvent_GeneratingMetricTitle,
  BusterThreadStepEvent_GeneratingResponse,
  BusterThreadStepEvent_GeneratingTimeFrame,
  BusterThreadStepEvent_Thought,
  BusterThreadStepEvent_SqlEvaluation,
  BusterThreadUser
} from '@/api/buster-rest';

export enum ThreadResponses {
  '/threads/list:getThreadsList' = '/threads/list:getThreadsList',
  '/threads/list:updateThreadsList' = '/threads/list:updateThreadsList',
  '/threads/post:initializeThread' = '/threads/post:initializeThread',
  '/threads/post:generatingMetricTitle' = '/threads/post:generatingMetricTitle',
  '/threads/post:generatingDataExplanation' = '/threads/post:generatingDataExplanation',
  '/threads/post:generatingResponse' = 'threads/post:generatingResponse',
  '/threads/post:fixingSql' = '/threads/post:fixingSql',
  '/threads/post:thought' = '/threads/post:thought',
  '/threads/post:fetchingData' = '/threads/post:fetchingData',
  '/threads/post:threadStepProgress' = '/threads/post:threadStepProgress',
  '/threads/post:completedThread' = '/threads/post:completedThread',
  '/threads/post:GeneratingDescription' = '/threads/post:GeneratingDescription',
  '/threads/get:leaveThread' = '/threads/get:leaveThread',
  '/threads/get:getThreadState' = '/threads/get:getThreadState',
  '/threads/get:joinedThread' = '/threads/get:joinedThread',
  '/threads/get:updateThreadState' = '/threads/get:updateThreadState',
  '/threads/get:fetchingData' = '/threads/get:fetchingData',
  '/threads/get:completed' = '/threads/get:completed',
  '/threads/update:updateThreadState' = '/threads/update:updateThreadState',
  '/threads/update' = '/threads/update',
  '/threads/unsubscribe:unsubscribed' = '/threads/unsubscribe:unsubscribed',
  '/threads/search:searchThreads' = '/threads/search:searchThreads',
  '/threads/get:leftThread' = '/threads/get:leftThread',
  '/threads/delete:deleteThreadState' = '/threads/delete:deleteThreadState',
  '/threads/messages/update:updateThreadState' = '/threads/messages/update:updateThreadState',
  '/threads/post:sqlEvaluation' = '/threads/post:sqlEvaluation',
  '/threads/duplicate:getThreadState' = '/threads/duplicate:getThreadState'
}

export type ThreadList_getThreadsList = {
  route: '/threads/list:getThreadsList';
  callback: (d: BusterThreadListItem[]) => void;
  onError?: (d: unknown) => void;
};

export type ThreadGet_updateThreadState = {
  route: '/threads/get:updateThreadState';
  callback: (d: [BusterThread]) => void;
  onError?: (d: unknown) => void;
};

export type Thread_Unsubscribe = {
  route: '/threads/unsubscribe:unsubscribed';
  callback: (d: { id: string }[]) => void;
  onError?: (d: unknown) => void;
};

export type ThreadGet_fetchingData = {
  route: '/threads/get:fetchingData';
  callback: (d: BusterThreadStepEvent_FetchingData) => void;
  onError?: (d: unknown) => void;
};

export type ThreadGet_joinedThread = {
  route: '/threads/get:joinedThread';
  callback: (d: BusterThreadUser[]) => void;
  onError?: (d: unknown) => void;
};

export type ThreadGet_leaveThread = {
  route: '/threads/get:leaveThread';
  callback: (d: BusterThreadUser[]) => void;
  onError?: (d: unknown) => void;
};

export type ThreadGet_getThreadState = {
  route: '/threads/get:getThreadState';
  callback: (d: [BusterThread]) => void;
  onError?: (d: unknown) => void;
};

export type ThreadUpdate_updateThreadState = {
  route: '/threads/update:updateThreadState';
  callback: (d: [BusterThread]) => void;
  onError?: (d: unknown) => void;
};

export type ThreadList_updateThreadsList = {
  route: '/threads/list:updateThreadsList';
  callback: (d: BusterThreadListItem[]) => void;
  onError?: (d: unknown) => void;
};

export type ThreadDuplicate_getThreadState = {
  route: '/threads/duplicate:getThreadState';
  callback: (d: [BusterThread]) => void;
  onError?: (d: unknown) => void;
};

/*********** THREAD PROGRESS EVENTS START */

export type ThreadPost_initializeThread = {
  route: '/threads/post:initializeThread';
  callback: (d: BusterThread) => void;
  onError?: (d: unknown) => void;
};

export type ThreadPost_generatingDescription = {
  route: '/threads/post:GeneratingDescription';
  callback: (d: BusterThreadStepEvent_GeneratingDescription) => void;
  onError?: (d: unknown) => void;
};

export type ThreadPost_generatingMetricTitle = {
  route: '/threads/post:generatingMetricTitle';
  callback: (d: BusterThreadStepEvent_GeneratingMetricTitle) => void;
  onError?: (d: unknown) => void;
};

export type ThreadPost_generatingResponse = {
  route: '/threads/post:generatingResponse';
  callback: (d: BusterThreadStepEvent_GeneratingResponse) => void;
  onError?: (d: unknown) => void;
};

export type ThreadPost_fixingSql = {
  route: '/threads/post:fixingSql';
  callback: (d: BusterThreadStepEvent_FixingSql) => void;
  onError?: (d: unknown) => void;
};

export type ThreadPost_fetchingData = {
  route: '/threads/post:fetchingData';
  callback: (d: BusterThreadStepEvent_FetchingData) => void;
  onError?: (d: unknown) => void;
};

export type ThreadPost_generatingTimeFrame = {
  route: '/threads/post:generatingTimeFrame';
  callback: (d: BusterThreadStepEvent_GeneratingTimeFrame) => void;
  onError?: (d: unknown) => void;
};

export type ThreadPost_thought = {
  route: '/threads/post:thought';
  callback: (d: BusterThreadStepEvent_Thought) => void;
  onError?: (d: unknown) => void;
};

export type ThreadPost_completed = {
  route: '/threads/post:completedThread';
  callback: (d: BusterThread) => void;
  onError?: (d: unknown) => void;
};

export type ThreadPost_sqlEvaluation = {
  route: '/threads/post:sqlEvaluation';
  callback: (d: BusterThreadStepEvent_SqlEvaluation) => void;
  onError?: (d: unknown) => void;
};

/*********** OTHER */

export type ThreadUpdate_subscribeToThread = {
  route: '/threads/update';
  callback: (d: [BusterThread]) => void;
  onError?: (d: unknown) => void;
};

export type ThreadDelete_deleteThreadState = {
  route: '/threads/delete:deleteThreadState';
  callback: (d: [null]) => void;
  onError?: (d: unknown) => void;
};

export type ThreadSearch_searchThreads = {
  route: '/threads/search:searchThreads';
  callback: (d: BusterThreadSearchItem[]) => void;
  onError?: (d: unknown) => void;
};

export type Thread_leftThread = {
  route: '/threads/get:leftThread';
  callback: (d: BusterThreadUser[]) => void;
  onError?: (d: unknown) => void;
};

export type ThreadMessage_updateThreadState = {
  route: '/threads/messages/update:updateThreadState';
  callback: (d: [BusterThread]) => void;
  onError?: (d: unknown) => void;
};

export type ThreadResponseTypes =
  | ThreadList_getThreadsList
  | Thread_Unsubscribe
  | ThreadGet_updateThreadState
  | ThreadGet_joinedThread
  | ThreadGet_leaveThread
  | ThreadGet_getThreadState
  | ThreadList_updateThreadsList
  | ThreadPost_initializeThread
  | ThreadPost_fixingSql
  | ThreadPost_fetchingData
  | ThreadUpdate_subscribeToThread
  | ThreadPost_generatingMetricTitle
  | ThreadPost_generatingResponse
  | ThreadPost_generatingTimeFrame
  | ThreadGet_fetchingData
  | ThreadPost_completed
  | ThreadUpdate_updateThreadState
  | ThreadSearch_searchThreads
  | Thread_leftThread
  | ThreadDelete_deleteThreadState
  | ThreadMessage_updateThreadState
  | ThreadPost_generatingDescription
  | ThreadPost_thought
  | ThreadPost_sqlEvaluation
  | ThreadDuplicate_getThreadState;
