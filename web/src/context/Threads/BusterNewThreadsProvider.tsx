'use client';

import { useMemoizedFn } from 'ahooks';
import React, { PropsWithChildren, useRef, useState } from 'react';
import { BusterRoutes } from '@/routes';
import { useBusterNotifications } from '../BusterNotifications/BusterNotifications';
import { useAppLayoutContextSelector } from '../BusterAppLayout';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useBusterThreadsContextSelector } from './BusterThreadsProvider';
import {
  BusterThread,
  BusterThreadStepEvent_GeneratingResponse,
  BusterThreadStepEvent_FixingSql,
  BusterThreadStepEvent_Thought,
  BusterThreadStepEvent_FetchingData,
  BusterThreadStepEvent_SqlEvaluation
} from '@/api/buster-rest/threads';
import { IBusterThreadMessage } from './interfaces';
import { timeout } from '@/utils';
import { upgradeMessageToIMessage, upgradeThreadToIThread } from './helpers';
import { BusterDatasetListItem } from '@/api/buster-rest/datasets';
import { ThreadDuplicate } from '@/api/buster-socket/threads';
import { useHotkeys } from 'react-hotkeys-hook';
import { isDev } from '@/config';
import isEmpty from 'lodash/isEmpty';
import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useBusterMessageDataContextSelector } from '../MessageData';

export const useBusterNewThreads = () => {
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const onToggleThreadsModal = useAppLayoutContextSelector((s) => s.onToggleThreadsModal);
  const { openErrorNotification, openInfoMessage } = useBusterNotifications();
  const busterSocket = useBusterWebSocket();

  //CONTEXT SELECTORS
  const onUpdateThread = useBusterThreadsContextSelector((x) => x.onUpdateThread);
  const onInitializeThread = useBusterThreadsContextSelector((x) => x.onInitializeThread);
  const unsubscribeToThreadEvents = useBusterThreadsContextSelector(
    (x) => x.unsubscribeToThreadEvents
  );
  const selectedThreadId = useBusterThreadsContextSelector((x) => x.selectedThreadId);
  const onUpdateThreadMessage = useBusterThreadsContextSelector((x) => x.onUpdateThreadMessage);
  const onSetCurrentMessageId = useBusterThreadsContextSelector((x) => x.onSetCurrentMessageId);
  const getThread = useBusterThreadsContextSelector((x) => x.getThreadNotLiveDataMethodOnly);
  const getThreadMessage = useBusterThreadsContextSelector(
    (x) => x.getThreadMessageNotLiveDataMethodOnly
  );
  const messages = useBusterThreadsContextSelector((x) => x.messages);
  const getMessageData = useBusterMessageDataContextSelector(
    ({ getMessageData }) => getMessageData
  );
  const getAllMessageDataMemoized = useBusterMessageDataContextSelector(
    ({ getAllMessageDataMemoized }) => getAllMessageDataMemoized
  );
  const onSetLoadingMessageData = useBusterMessageDataContextSelector(
    ({ onSetLoadingMessageData }) => onSetLoadingMessageData
  );
  const onSetMessageData = useBusterMessageDataContextSelector(
    ({ onSetMessageData }) => onSetMessageData
  );

  //STATE
  const [prompt, setPrompt] = useState<string>('');
  const [selectedThreadDataSource, setSelectedThreadDataSource] =
    useState<BusterDatasetListItem | null>(null); //Maybe we can move this?
  const [loadingNewThread, setLoadingNewThread] = useState<boolean>(false);
  const safeToUnsubscribe = useRef<boolean>(true);

  //METHODS
  const onSetSelectedThreadDataSource = useMemoizedFn((dataSet: BusterDatasetListItem | null) => {
    setSelectedThreadDataSource(dataSet);
  });

  const onSetPrompt = useMemoizedFn((prompt: string) => {
    const trimmedPrompt = prompt.replace(/\n/g, '');
    setPrompt(trimmedPrompt);
  });

  const onStartNewThread = useMemoizedFn(async (prompt: string) => {
    if (loadingNewThread) return;
    if (!prompt || prompt.length < 2) {
      return openInfoMessage('Please enter a prompt to start a new thread.');
    }
    setLoadingNewThread(true);
    onSetPrompt(prompt);
    safeToUnsubscribe.current = false;
    if (selectedThreadId) {
      await Promise.race([
        unsubscribeFromAllThreadEvents({ threadId: selectedThreadId }),
        timeout(250)
      ]);
    }

    try {
      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/threads/post',
          payload: {
            dataset_id: selectedThreadDataSource?.id || null,
            thread_id: null,
            prompt
          }
        },
        responseEvent: {
          route: '/threads/post:initializeThread',
          callback: async (response) => {
            onInitializeThread(response, { isNewThread: true, isCompleted: false });
            _subscribeToNewThreadEvents({ thread_id: response.id });
            onChangePage({
              route: BusterRoutes.APP_THREAD_ID,
              threadId: response.id
            });
          },
          onError: openErrorNotification
        }
      });
    } catch (e) {
      openErrorNotification(e);
    }
  });

  const onAskFollowUpQuestion = useMemoizedFn(
    async ({
      replaceMessageId,
      prompt,
      threadId,
      suggestion_id
    }: {
      replaceMessageId?: string;
      threadId: string;
      prompt: string;
      suggestion_id?: string;
    }) => {
      onSetCurrentMessageId({
        threadId,
        messageId: null,
        forceAddToUndoStack: true
      });
      await Promise.race([
        _unsubscribeToNewThreadEvents({ threadId: selectedThreadId }),
        timeout(5)
      ]);
      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/threads/post',
          payload: {
            dataset_id: null,
            thread_id: threadId,
            prompt,
            message_id: replaceMessageId,
            suggestion_id
          }
        },
        responseEvent: {
          route: '/threads/post:initializeThread',
          callback: (response) => {
            onInitializeThread(response, {
              isNewThread: false,
              isFollowupMessage: true,
              isCompleted: false
            });
            _subscribeToNewThreadEvents({
              thread_id: response.id,
              ignoreRoutes: ['/threads/post:completedThread']
            });
          },
          onError: openErrorNotification
        }
      });
      const res = await busterSocket.once({
        route: '/threads/post:completedThread',
        callback: onNewThreadCompleted
      });

      return res;
    }
  );

  const onEditMessage = useMemoizedFn(
    async ({
      threadId,
      messageId,
      prompt
    }: {
      threadId: string;
      messageId: string;
      prompt: string;
    }) => {
      let updatedThreadWithRemovedMessages = getThread({ threadId });
      const messageIndex = updatedThreadWithRemovedMessages.messages.findIndex(
        (id) => id === messageId
      );
      if (messageIndex !== -1) {
        updatedThreadWithRemovedMessages.messages = updatedThreadWithRemovedMessages.messages.slice(
          0,
          messageIndex + 1
        );
      }
      const selectedMessageId =
        updatedThreadWithRemovedMessages.messages[
          updatedThreadWithRemovedMessages.messages.length - 1
        ];

      updatedThreadWithRemovedMessages.messages[
        updatedThreadWithRemovedMessages.messages.length - 1
      ] = selectedMessageId;

      onUpdateThread(updatedThreadWithRemovedMessages);
      await Promise.race([
        _unsubscribeToNewThreadEvents({ threadId: selectedThreadId }),
        timeout(5)
      ]);
      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/threads/post',
          payload: {
            dataset_id: null,
            thread_id: threadId,
            prompt,
            message_id: messageId
          }
        },
        responseEvent: {
          route: '/threads/post:initializeThread',
          callback: (response) => {
            onInitializeThread(response, {
              isNewThread: false,
              isFollowupMessage: true,
              isCompleted: false
            });
            _subscribeToNewThreadEvents({
              thread_id: response.id,
              ignoreRoutes: ['/threads/post:completedThread']
            });
            return response;
          },
          onError: openErrorNotification
        }
      });
      const res = (await busterSocket.once({
        route: '/threads/post:completedThread',
        callback: onNewThreadCompleted
      })) as BusterThread;

      return res as BusterThread;
    }
  );

  const _mapMatchingSQL = useMemoizedFn(
    ({ threadId, messageId, code }: { messageId: string; threadId: string; code: string }) => {
      const allMessageData = getAllMessageDataMemoized();
      const allMessageDataValues = Object.values(getAllMessageDataMemoized());
      if (!code || allMessageData[messageId]) return;
      const matchingMessageBySql = allMessageDataValues.find((data) => data.code === code);
      if (matchingMessageBySql && !isEmpty(matchingMessageBySql?.data)) {
        onSetMessageData({
          messageId,
          data: matchingMessageBySql.data,
          data_metadata: matchingMessageBySql.data_metadata,
          retrievedData: true,
          fetchingData: false,
          code: matchingMessageBySql.code
        });
      }
    }
  );

  //LISTENERS

  const onFetchingData = useMemoizedFn((payload: BusterThreadStepEvent_FetchingData) => {
    const { thread_id: threadId, message_id: messageId } = payload;
    let updatedMessage: Partial<IBusterThreadMessage> = {};
    const isCompleted = payload.progress === 'completed';
    if (isCompleted) {
      const oldMessage = getThreadMessage({ threadId, messageId });
      const updatedMessageCombined = {
        ...oldMessage!,
        ...updatedMessage,
        ...payload
      };
      updatedMessage = upgradeMessageToIMessage(updatedMessageCombined, oldMessage);
      updatedMessage.data_metadata = payload.data_metadata;
      updatedMessage.title = payload.title;
      updatedMessage.description = payload.description;
      updatedMessage.time_frame = payload.time_frame;
      updatedMessage.dataset_id = payload.dataset_id;
      updatedMessage.dataset_name = payload.dataset_name;
      onSetMessageData({
        messageId,
        data: payload.data,
        retrievedData: true,
        fetchingData: false,
        data_metadata: payload.data_metadata,
        code: payload.code
      });
    } else {
      onSetLoadingMessageData({ messageId, code: payload.code });
    }
    onUpdateThreadMessage(
      {
        threadId,
        messageId,
        message: updatedMessage
      },
      false
    );
  });

  const onGeneratingResponse = useMemoizedFn(
    (payload: BusterThreadStepEvent_GeneratingResponse) => {
      const { thread_id, message_id, text_chunk, text } = payload;
      const currentMessage = getThreadMessage({
        threadId: thread_id,
        messageId: message_id
      });
      const currentRecentMessage: string = currentMessage?.response || '';

      const updatedMessage = {
        response: currentRecentMessage
      };
      if (payload.progress === 'completed') {
        updatedMessage.response = text || '';
      } else if (payload.progress === 'inProgress') {
        const newMessage = currentRecentMessage + text_chunk;
        updatedMessage.response = newMessage;
      }

      onUpdateThreadMessage(
        {
          threadId: thread_id,
          messageId: message_id,
          message: updatedMessage
        },
        false
      );
    }
  );

  const onFixingSql = useMemoizedFn((payload: BusterThreadStepEvent_FixingSql) => {
    const { thread_id: threadId, message_id: messageId } = payload;
    const currentMessage = getThreadMessage({ threadId, messageId })!;
    const updatedMessage: Partial<IBusterThreadMessage> = {};
    if (payload.progress === 'inProgress') {
      updatedMessage.code = (currentMessage?.code || '') + (payload.sql_chunk || '');
    } else if (payload.progress === 'completed') {
      updatedMessage.code = payload.sql;
    }
    onUpdateThreadMessage(
      {
        threadId,
        messageId,
        message: updatedMessage
      },
      false
    );
  });

  const onThoughts = useMemoizedFn((payload: BusterThreadStepEvent_Thought) => {
    const { thread_id: threadId, message_id: messageId } = payload;
    const updatedMessage = getThreadMessage({ threadId, messageId })!;
    updatedMessage.thoughts = {
      title: payload.title,
      thoughts: payload.thoughts,
      completed: payload.progress === 'completed'
    };

    onUpdateThreadMessage(
      {
        threadId,
        messageId,
        message: updatedMessage
      },
      false
    );
  });

  const onSqlEvaluation = useMemoizedFn((payload: BusterThreadStepEvent_SqlEvaluation) => {
    const { thread_id: threadId, message_id: messageId } = payload;
    const currentMessage = getThreadMessage({ threadId, messageId })!;
    const newMessage = {
      ...currentMessage,
      evaluation_summary: payload.evaluation_summary,
      evaluation_score: payload.evaluation_score
    };
    onUpdateThreadMessage({ threadId, messageId, message: newMessage }, false);
  });

  const onNewThreadCompleted = useMemoizedFn((thread: BusterThread) => {
    const oldThread = getThread({ threadId: thread.id });
    const { upgradedThread, upgradedMessages } = upgradeThreadToIThread(
      thread,
      oldThread,
      messages,
      {
        threadParams: { isFollowupMessage: false, isNewThread: false },
        messageParams: { isCompleted: true }
      }
    );

    const lastMessageInThread = upgradedThread.messages[upgradedThread.messages.length - 1];
    const lastMessage = upgradedMessages[lastMessageInThread];

    if (lastMessage?.code) {
      _mapMatchingSQL({
        threadId: thread.id,
        messageId: lastMessageInThread,
        code: lastMessage.code
      });
    }

    onUpdateThread(upgradedThread, upgradedMessages);
    _unsubscribeToNewThreadEvents({ threadId: thread.id });
    safeToUnsubscribe.current = true;
  });

  const _subscribeToNewThreadEvents = useMemoizedFn(
    ({
      thread_id,
      ignoreRoutes
    }: {
      thread_id: string;
      ignoreRoutes?: '/threads/post:completedThread'[];
    }) => {
      busterSocket.on({
        route: '/threads/post:fetchingData',
        callback: onFetchingData
      });

      busterSocket.on({
        route: '/threads/post:generatingResponse',
        callback: onGeneratingResponse
      });

      busterSocket.on({
        route: '/threads/post:fixingSql',
        callback: onFixingSql
      });

      busterSocket.on({
        route: '/threads/post:thought',
        callback: onThoughts
      });

      busterSocket.on({
        route: '/threads/post:sqlEvaluation',
        callback: onSqlEvaluation
      });

      if (!ignoreRoutes?.includes('/threads/post:completedThread')) {
        busterSocket.on({
          route: '/threads/post:completedThread',
          callback: onNewThreadCompleted
        });
      }
    }
  );

  const _unsubscribeToNewThreadEvents = useMemoizedFn(({ threadId }: { threadId: string }) => {
    busterSocket.off({
      route: '/threads/post:fetchingData',
      callback: onFetchingData
    });

    busterSocket.off({
      route: '/threads/post:generatingResponse',
      callback: onGeneratingResponse
    });

    busterSocket.off({
      route: '/threads/post:completedThread',
      callback: onNewThreadCompleted
    });

    busterSocket.off({
      route: '/threads/post:thought',
      callback: onThoughts
    });
  });

  const onClearNewThreadModal = useMemoizedFn((resetDataSource = false) => {
    if (resetDataSource) {
      setSelectedThreadDataSource(null);
    }
    setTimeout(() => {
      setPrompt('');
      setLoadingNewThread(false);
    }, 280);
    onToggleThreadsModal(false);
  });

  const unsubscribeFromAllThreadEvents = useMemoizedFn(
    async ({ threadId }: { threadId: string }) => {
      _unsubscribeToNewThreadEvents({ threadId });
      unsubscribeToThreadEvents({ threadId });

      const promiseCallback = new Promise((resolve) => {
        busterSocket.emitAndOnce({
          emitEvent: {
            route: '/threads/unsubscribe',
            payload: { id: threadId }
          },
          responseEvent: {
            route: '/threads/unsubscribe:unsubscribed',
            callback: resolve
          }
        });
      });

      return promiseCallback;
    }
  );

  const duplicateThread = useMemoizedFn(async (params: ThreadDuplicate['payload']) => {
    const res = (await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/threads/duplicate',
        payload: params
      },
      responseEvent: {
        route: '/threads/duplicate:getThreadState',
        callback: (response) => {
          onInitializeThread(response[0], {
            isNewThread: false,
            isCompleted: false,
            isFollowupMessage: false
          });
          _subscribeToNewThreadEvents({ thread_id: response[0].id });
        }
      }
    })) as [BusterThread];
    return res[0] as BusterThread;
  });

  useHotkeys('f+h', () => {
    if (isDev) {
      const tenQuestions = [
        'Show me all of my customers with a name that starts with A',
        'Show me month over month sales for the last 12 months broken down by product category',
        'Show me the top 5 customers by revenue',
        'Show me month over month sales for the last 12 months broken down by month',
        'What is the total revenue for the company?',
        'How many customers have a balance greater than $1000?',
        'What is the average order value?',
        'What is the total revenue for the company?',
        'How many customers have a balance greater than $1000?',
        'What is the average order value?',
        'What is the total revenue for the company?',
        'How many customers have a balance greater than $1000?',
        'What is the average order value?',
        'Show me all of my categories',
        'Show me all of my products'
      ];

      tenQuestions.forEach((question) => {
        onStartNewThread(question).then((v) => {});
      });
    }
  });

  return {
    duplicateThread,
    onSetSelectedThreadDataSource,
    onSetPrompt,
    prompt,
    onStartNewThread,
    loadingNewThread,
    selectedThreadDataSource,
    unsubscribeFromAllThreadEvents,
    safeToUnsubscribe,
    onClearNewThreadModal,
    onAskFollowUpQuestion,
    onEditMessage
  };
};

const BusterNewThreads = createContext<ReturnType<typeof useBusterNewThreads>>(
  {} as ReturnType<typeof useBusterNewThreads>
);

export const BusterNewThreadsProvider = React.memo(function BusterNewThreadsProvider({
  children
}: PropsWithChildren) {
  const newThreadsContext = useBusterNewThreads();

  return (
    <BusterNewThreads.Provider value={newThreadsContext}>{children}</BusterNewThreads.Provider>
  );
});

export const useBusterNewThreadsContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterNewThreads>, T>
) => {
  return useContextSelector(BusterNewThreads, selector);
};
