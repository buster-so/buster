import React, { PropsWithChildren, useMemo, useRef, useState } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { BusterNewThreadsProvider } from './BusterNewThreadsProvider';
import { BusterThreadsListProvider } from './BusterThreadsListProvider';
import { defaultIBusterThread } from './config';
import { useDebounceFn, useMemoizedFn, useMount, useWhyDidYouUpdate } from 'ahooks';
import type { IBusterThread, IBusterThreadMessage } from './interfaces';
import type { BusterThread, BusterThreadUser, BusterVerificationStatus } from '@/api/buster-rest';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useParams } from 'next/navigation';
import { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import { ShareRole, ThreadUpdateMessage, ThreadUpdateThread } from '@/api/buster-socket/threads';
import { resolveEmptyThread, upgradeThreadToIThread, prepareThreadUpdateMessage } from './helpers';
import { useUserConfigContextSelector } from '../Users';
import { useBusterAssetsContextSelector } from '../Assets/BusterAssetsProvider';
import { useBusterUndoRedo } from './useBusterUndoRedo';
import { useDashboardContextSelector } from '../Dashboards';
import { useBusterNotifications } from '../BusterNotifications';
import last from 'lodash/last';
import { useTransition } from 'react';
import type { IColumnLabelFormat } from '@/components/charts/interfaces/columnLabelInterfaces';
import type { ColumnSettings } from '@/components/charts/interfaces/columnInterfaces';
import { useBusterMessageDataContextSelector } from '../MessageData';
import { RustApiError } from '@/api/buster-rest/errors';

export const useBusterThreads = () => {
  const [isPending, startTransition] = useTransition();
  const { threadId: selectedThreadId } = useParams<{ threadId: string }>();
  const { openInfoMessage, openConfirmModal } = useBusterNotifications();
  const busterSocket = useBusterWebSocket();
  const getDataByMessageId = useBusterMessageDataContextSelector(
    ({ getDataByMessageId }) => getDataByMessageId
  );
  const userFavorites = useUserConfigContextSelector((state) => state.userFavorites);
  const forceGetFavoritesList = useUserConfigContextSelector((x) => x.forceGetFavoritesList);
  const removeItemFromIndividualDashboard = useDashboardContextSelector(
    (state) => state.removeItemFromIndividualDashboard
  );
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const setAssetPasswordError = useBusterAssetsContextSelector(
    (state) => state.setAssetPasswordError
  );
  const threadsRef = useRef<Record<string, IBusterThread>>({});
  const messagesRef = useRef<Record<string, IBusterThreadMessage>>({});
  const [currentMessageIdByThread, setCurrentMessageIdByThread] = useState<
    Record<string, string | null>
  >({});
  const [editingThreadTitle, setEditingThreadTitle] = useState(false);

  const setThreads = useMemoizedFn((newThreads: Record<string, IBusterThread>) => {
    threadsRef.current = { ...newThreads };
    startTransition(() => {
      //trigger a rerender
    });
  });

  const resetThread = useMemoizedFn(({ threadId }: { threadId: string }) => {
    const prev = threadsRef.current;
    delete prev[threadId];
    setThreads(prev);
  });

  const saveThreadToDashboard = useMemoizedFn(
    async ({ threadId, dashboardIds }: { threadId: string; dashboardIds: string[] }) => {
      const lastId = last(dashboardIds);
      const prev = threadsRef.current;
      setThreads({
        ...prev,
        [threadId]: {
          ...prev[threadId],
          dashboards: [
            ...prev[threadId].dashboards,
            ...dashboardIds.map((id) => {
              return { id, name: '' };
            })
          ]
        }
      });
      let promises: Promise<any>[] = [];
      dashboardIds.forEach((dashboardId) => {
        promises.push(
          busterSocket.emitAndOnce({
            emitEvent: {
              route: '/threads/update',
              payload: {
                id: threadId,
                save_to_dashboard: dashboardId
              }
            },
            responseEvent: {
              route: '/threads/update:updateThreadState',
              callback: (d: [BusterThread]) => d
            }
          })
        );
      });
      await Promise.all(promises);
      return lastId;
    }
  );

  const saveThreadToCollection = useMemoizedFn(
    async ({ threadId, collectionIds }: { threadId: string; collectionIds: string[] }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        const searchId = f.collection_id || f.id;
        return collectionIds.includes(searchId);
      });
      const addToPromises: Promise<unknown>[] = [];
      collectionIds.forEach((collectionId) => {
        const promise = busterSocket.emitAndOnce({
          emitEvent: {
            route: '/threads/update',
            payload: {
              id: threadId,
              add_to_collections: [collectionId]
            }
          },
          responseEvent: {
            route: '/threads/update:updateThreadState',
            callback: (d: [BusterThread]) => d
          }
        });
        addToPromises.push(promise);
      });

      const prev = threadsRef.current;

      const hasPreviousThread = prev[threadId];
      if (!hasPreviousThread) return; //if the thread doesn't exist, don't save to collections

      setThreads({
        ...prev,
        [threadId]: {
          ...prev[threadId],
          collections: [
            ...prev[threadId].collections,
            ...collectionIds.map((id) => {
              return { id, name: '' };
            })
          ]
        }
      });

      if (addToPromises.length) await Promise.all(addToPromises);
      if (collectionIsInFavorites) {
        await forceGetFavoritesList();
      }
    }
  );

  const removeThreadFromDashboard = useMemoizedFn(
    async ({
      threadId,
      dashboardId,
      useConfirmModal = true
    }: {
      threadId: string;
      dashboardId: string;
      useConfirmModal?: boolean;
    }) => {
      const prev = threadsRef.current;

      const onOk = async () => {
        if (prev[threadId]) {
          setThreads({
            ...prev,
            [threadId]: {
              ...prev[threadId],
              dashboards: prev[threadId].dashboards.filter((d) => d.id !== dashboardId)
            }
          });
        }
        removeItemFromIndividualDashboard({
          dashboardId,
          threadId
        });
        return await busterSocket.emitAndOnce({
          emitEvent: {
            route: '/threads/update',
            payload: {
              id: threadId,
              remove_from_dashboard: dashboardId
            }
          },
          responseEvent: {
            route: '/threads/update:updateThreadState',
            callback: (d: [BusterThread]) => d
          }
        });
      };
      if (!useConfirmModal) return await onOk();
      return await openConfirmModal({
        title: 'Remove from dashboard',
        content: 'Are you sure you want to remove this thread from this dashboard?',
        onOk
      });
    }
  );

  const removeThreadFromCollection = useMemoizedFn(
    async ({
      threadId,
      collectionId,
      ignoreFavoriteUpdates
    }: {
      threadId: string;
      collectionId: string;
      ignoreFavoriteUpdates?: boolean;
    }) => {
      const currentThread = _getThread({ threadId });
      const collectionIsInFavorites = userFavorites.some((f) => {
        const searchId = f.collection_id || f.id;
        return currentThread.collections.some((c) => c.id === searchId);
      });

      const prev = threadsRef.current;

      const hasPreviousThread = prev[threadId];
      if (hasPreviousThread) {
        setThreads({
          ...prev,
          [threadId]: {
            ...prev[threadId],
            collections: prev[threadId].collections.filter((d) => d.id !== collectionId)
          }
        });
      }

      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/threads/update',
          payload: {
            id: threadId,
            remove_from_collections: [collectionId]
          }
        },
        responseEvent: {
          route: '/threads/update:updateThreadState',
          callback: (d: any) => d
        }
      });
      if (collectionIsInFavorites && ignoreFavoriteUpdates !== true) {
        await forceGetFavoritesList();
      }
    }
  );

  const deleteThread = useMemoizedFn(async ({ threadIds }: { threadIds: string[] }) => {
    return await openConfirmModal({
      title: 'Delete thread',
      content: 'Are you sure you want to delete this thread?',
      onOk: async () => {
        await busterSocket.emitAndOnce({
          emitEvent: {
            route: '/threads/delete',
            payload: {
              ids: threadIds
            }
          },
          responseEvent: {
            route: '/threads/delete:deleteThreadState',
            callback: (d: any) => {}
          }
        });
      },
      useReject: true
    });
  });

  //UI SELECTORS

  const _getSearchMessageId = useMemoizedFn(
    ({ threadId, messageId }: { threadId?: string; messageId?: string }): string => {
      const _selectedThreadId = threadId || selectedThreadId;
      return (
        messageId ||
        currentMessageIdByThread[_selectedThreadId] ||
        last(_getThread({ threadId: _selectedThreadId })?.messages)!
      );
    }
  );

  const _getThread = useMemoizedFn(({ threadId }: { threadId: string }): IBusterThread => {
    const threads = threadsRef.current || {};
    const currentThread = threads[threadId];
    return resolveEmptyThread(currentThread, threadId);
  });

  const _getThreadMessage = useMemoizedFn(
    ({ threadId, messageId }: { threadId?: string; messageId?: string }) => {
      const searchMessageId = _getSearchMessageId({ threadId, messageId });
      const selectedMessage = messagesRef.current[searchMessageId];
      return selectedMessage || null;
    }
  );

  //STATE UPDATERS

  const onSetCurrentMessageId = useMemoizedFn(
    ({
      threadId,
      messageId,
      forceAddToUndoStack
    }: {
      threadId: string;
      messageId: string | null;
      forceAddToUndoStack?: boolean;
    }) => {
      if (currentMessageIdByThread[threadId] === messageId) return;
      const selectedThread = _getThread({ threadId });

      setCurrentMessageIdByThread({
        ...currentMessageIdByThread,
        [threadId]: messageId
      });

      if (messageId && !selectedThread?.isNewThread) {
        getDataByMessageId({ messageId });
      }

      const selectedMessageId = _getSearchMessageId({ threadId, messageId: messageId! });
      undoRedoParams.addToUndoStack({
        threadId,
        messageId: selectedMessageId
      });
    }
  );

  const onInitializeThread = useMemoizedFn(
    (
      newThread: BusterThread,
      params?: {
        isNewThread?: boolean;
        isFollowupMessage?: boolean;
        isCompleted?: boolean;
      }
    ) => {
      const threads = threadsRef.current || {};
      const additionalParams = {
        isNewThread: false,
        isFollowupMessage: false,
        isCompleted: false,
        ...params
      };
      const oldThread = threads[newThread.id] as IBusterThread | undefined; //HMMM is this right?
      const busterThread: BusterThread = {
        ...defaultIBusterThread,
        ...newThread
      };

      const { upgradedThread, upgradedMessages } = upgradeThreadToIThread(
        busterThread,
        oldThread,
        messagesRef.current,
        {
          threadParams: additionalParams,
          messageParams: {
            isCompleted: additionalParams.isCompleted
          }
        }
      );

      onUpdateThread(upgradedThread, upgradedMessages);
    }
  );

  const bulkUpdateThreadMessages = useMemoizedFn(
    (newMessages: Record<string, IBusterThreadMessage>) => {
      messagesRef.current = {
        ...messagesRef.current,
        ...newMessages
      };
    }
  );

  const onUpdateThread = useMemoizedFn(
    (
      newThread: Partial<IBusterThread> & { id: string },
      newMessages?: Parameters<typeof bulkUpdateThreadMessages>[0]
    ) => {
      const prevThreads = threadsRef.current || {};
      const existingThread = prevThreads[newThread.id];
      const _newThread = {
        ...defaultIBusterThread,
        ...existingThread,
        ...newThread
      };

      if (newMessages) bulkUpdateThreadMessages(newMessages);

      setThreads({
        ...prevThreads,
        [newThread.id]: _newThread
      });
    }
  );

  const onUpdateThreadMessage = useMemoizedFn(
    async (
      {
        threadId,
        message: newMessagePartial,
        messageId
      }: {
        threadId: string;
        messageId: string;
        message: Partial<IBusterThreadMessage>;
      },
      saveToServer: boolean = true
    ) => {
      const currentThread = _getThread({ threadId })!;
      const searchMessageId = _getSearchMessageId({ threadId, messageId });
      const editMessage = _getThreadMessage({ threadId, messageId: searchMessageId });
      const newMessageObject = {
        ...editMessage,
        ...newMessagePartial
      } as IBusterThreadMessage;

      messagesRef.current[searchMessageId] = newMessageObject;

      //This will trigger a rerender and push prepareThreadUpdateMessage off UI thread
      startTransition(() => {
        const isReadyOnly = currentThread.permission === ShareRole.VIEWER;
        if (saveToServer && !isReadyOnly) {
          _prepareThreadAndSaveToServer(newMessageObject, editMessage);
        }
      });
    }
  );

  const { run: _prepareThreadAndSaveToServer } = useDebounceFn(
    useMemoizedFn((newMessageObject: IBusterThreadMessage, oldMessage: IBusterThreadMessage) => {
      const changedValues = prepareThreadUpdateMessage(newMessageObject, oldMessage);
      if (changedValues) {
        _updateThreadMessageToServer(changedValues);
      }
    }),
    { wait: 700 }
  );

  const onUpdateMessageChartConfig = useMemoizedFn(
    ({
      threadId,
      chartConfig,
      messageId,
      ignoreUndoRedo
    }: {
      threadId?: string;
      messageId?: string;
      chartConfig: Partial<IBusterThreadMessageChartConfig>;
      ignoreUndoRedo?: boolean;
    }) => {
      const editMessage = _getThreadMessage({
        threadId,
        messageId
      });

      if (!ignoreUndoRedo) {
        undoRedoParams.addToUndoStack({
          threadId: editMessage.thread_id,
          messageId: editMessage.id,
          chartConfig: editMessage.chart_config
        });
      }

      const newChartConfig: IBusterThreadMessageChartConfig = {
        ...editMessage.chart_config,
        ...chartConfig
      };

      return onUpdateThreadMessage({
        threadId: editMessage.thread_id,
        messageId: editMessage.id,
        message: {
          chart_config: newChartConfig
        }
      });
    }
  );

  const onUpdateColumnLabelFormat = useMemoizedFn(
    ({
      columnId,
      columnLabelFormat,
      threadId,
      messageId
    }: {
      columnId: string;
      threadId?: string;
      messageId?: string;
      columnLabelFormat: Partial<IColumnLabelFormat>;
    }) => {
      const editMessage = _getThreadMessage({
        threadId,
        messageId
      });
      const existingColumnLabelFormats = editMessage.chart_config.columnLabelFormats;
      const existingColumnLabelFormat = existingColumnLabelFormats[columnId];
      const newColumnLabelFormat = {
        ...existingColumnLabelFormat,
        ...columnLabelFormat
      };
      const columnLabelFormats = {
        ...existingColumnLabelFormats,
        [columnId]: newColumnLabelFormat
      };
      onUpdateMessageChartConfig({
        threadId,
        messageId,
        chartConfig: {
          columnLabelFormats
        }
      });
    }
  );

  const onUpdateColumnSetting = useMemoizedFn(
    ({
      columnId,
      columnSetting,
      threadId,
      messageId
    }: {
      columnId: string;
      columnSetting: Partial<ColumnSettings>;
      threadId?: string;
      messageId?: string;
    }) => {
      const editMessage = _getThreadMessage({
        threadId,
        messageId
      });
      const existingColumnSettings = editMessage.chart_config.columnSettings;
      const existingColumnSetting = editMessage.chart_config.columnSettings[columnId];
      const newColumnSetting: Required<ColumnSettings> = {
        ...existingColumnSetting,
        ...columnSetting
      };
      const newColumnSettings: Record<string, Required<ColumnSettings>> = {
        ...existingColumnSettings,
        [columnId]: newColumnSetting
      };
      onUpdateMessageChartConfig({
        threadId,
        messageId,
        chartConfig: {
          columnSettings: newColumnSettings
        }
      });
    }
  );

  const onSaveThreadChanges = useMemoizedFn(
    async ({
      threadId,
      ...params
    }: {
      threadId: string;
      save_draft: boolean;
      save_as_thread_state?: string;
    }) => {
      return busterSocket.emitAndOnce({
        emitEvent: {
          route: '/threads/update',
          payload: {
            id: threadId,
            ...params
          }
        },
        responseEvent: {
          route: '/threads/update:updateThreadState',
          callback: _onUpdateThread
        }
      }) as Promise<[BusterThread]>;
    }
  );

  //UNDO REDO

  const undoRedoParams = useBusterUndoRedo({
    getSearchMessageId: _getSearchMessageId,
    onSetCurrentMessageId,
    currentMessageIdByThread,
    onUpdateMessageChartConfig,
    messagesRef
  });

  //LISTENERS

  const _onGetThreadState = useMemoizedFn((_thread: [BusterThread]) => {
    const thread = _thread[0];
    onInitializeThread(thread, { isCompleted: true });
  });

  const _onGetThreadStateError = useMemoizedFn((_error: any, threadId: string) => {
    const error = _error as RustApiError;
    setAssetPasswordError(threadId, error.message || 'An error occurred');
  });

  const _onJoinedThread = useMemoizedFn((users: BusterThreadUser[]) => {
    users.forEach((user) => {
      openInfoMessage(`${user.name} has joined the thread`);
    });
  });

  const _onLeaveThread = useMemoizedFn((users: BusterThreadUser[]) => {
    users.forEach((user) => {
      openInfoMessage(`${user.name} has left the thread`);
    });
  });

  const _onUpdateThread = useMemoizedFn((_thread: [BusterThread]) => {
    const thread = _thread[0];
    if (thread) {
      onInitializeThread(thread, {
        isFollowupMessage: false,
        isNewThread: false,
        isCompleted: true
      });
    }
  });

  const _onCheckUpdateThreadMessage = useMemoizedFn((thread: [BusterThread], messageId: string) => {
    const newMessage = thread[0].messages.find((m) => m.id === messageId);
    const currentMessage = _getThreadMessage({
      threadId: selectedThreadId,
      messageId: messageId
    });

    if (newMessage?.draft_session_id && !currentMessage?.draft_session_id) {
      onUpdateThreadMessage(
        {
          threadId: selectedThreadId,
          messageId: messageId,
          message: {
            draft_session_id: newMessage.draft_session_id
          }
        },
        false
      );
    }

    return thread;
  });

  // EMITTERS

  const subscribeToThread = useMemoizedFn(({ threadId }: { threadId: string }) => {
    const { password } = getAssetPassword(threadId);
    busterSocket.emitAndOnce({
      emitEvent: {
        route: '/threads/get',
        payload: {
          id: threadId,
          password
        }
      },
      responseEvent: {
        route: '/threads/get:getThreadState',
        callback: _onGetThreadState,
        onError: (error) => _onGetThreadStateError(error, threadId)
      }
    });
    busterSocket.on({
      route: '/threads/get:joinedThread',
      callback: _onJoinedThread
    });
    busterSocket.on({
      route: '/threads/get:leaveThread',
      callback: _onLeaveThread
    });
  });

  const unsubscribeToThreadEvents = useMemoizedFn(({ threadId }: { threadId: string }) => {
    busterSocket.off({
      route: '/threads/get:joinedThread',
      callback: _onJoinedThread
    });
    busterSocket.off({
      route: '/threads/get:leaveThread',
      callback: _onLeaveThread
    });
    busterSocket.off({
      route: '/threads/update:updateThreadState',
      callback: _onUpdateThread
    });
  });

  const updateThreadMessageToServer = useMemoizedFn((payload: ThreadUpdateMessage['payload']) => {
    return busterSocket.emitAndOnce({
      emitEvent: {
        route: '/threads/messages/update',
        payload
      },
      responseEvent: {
        route: '/threads/messages/update:updateThreadState',
        callback: (v) => _onCheckUpdateThreadMessage(v, payload.id)
      }
    });
  });

  const { run: _updateThreadMessageToServer } = useDebounceFn(updateThreadMessageToServer, {
    wait: 300
  });

  const onShareThread = useMemoizedFn(
    async (
      payload: Pick<
        ThreadUpdateThread['payload'],
        | 'id'
        | 'publicly_accessible'
        | 'public_password'
        | 'user_permissions'
        | 'team_permissions'
        | 'public_expiry_date'
        | 'remove_users'
        | 'remove_teams'
      >
    ) => {
      //keep this seperate from _updateThreadToServer because we need to do some extra stuff
      return busterSocket.emitAndOnce({
        emitEvent: {
          route: '/threads/update',
          payload
        },
        responseEvent: {
          route: '/threads/update:updateThreadState',
          callback: _onUpdateThread
        }
      });
    }
  );

  const onVerifiedThread = useMemoizedFn(
    async ({
      threadId,
      messageId,
      status
    }: {
      threadId: string;
      messageId?: string;
      status: BusterVerificationStatus;
    }) => {
      const selectedMessageId = _getSearchMessageId({ messageId, threadId });

      if (!selectedMessageId) return;
      return await onUpdateThreadMessage({
        threadId,
        messageId: selectedMessageId,
        message: {
          status
        }
      });
    }
  );

  return {
    ...undoRedoParams,
    resetThread,
    deleteThread,
    onVerifiedThread,
    onShareThread,
    onUpdateThread,
    onUpdateThreadMessage,
    onInitializeThread,
    subscribeToThread,
    unsubscribeToThreadEvents,
    onUpdateMessageChartConfig,
    updateThreadMessageToServer,
    onUpdateColumnLabelFormat,
    onUpdateColumnSetting,
    saveThreadToDashboard,
    onSetCurrentMessageId,
    removeThreadFromDashboard,
    removeThreadFromCollection,
    saveThreadToCollection,
    editingThreadTitle,
    setEditingThreadTitle,
    selectedThreadId,
    onSaveThreadChanges,
    getThreadNotLiveDataMethodOnly: _getThread,
    getThreadMessageNotLiveDataMethodOnly: _getThreadMessage,
    currentMessageIdByThread,
    threads: threadsRef.current,
    messages: messagesRef.current
  };
};

const BusterThreads = createContext<ReturnType<typeof useBusterThreads>>(
  {} as ReturnType<typeof useBusterThreads>
);

export const BusterThreadsProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  return (
    <BusterThreads.Provider value={useBusterThreads()}>
      <BusterThreadsListProvider>
        <BusterNewThreadsProvider>{children}</BusterNewThreadsProvider>
      </BusterThreadsListProvider>
    </BusterThreads.Provider>
  );
});
BusterThreadsProvider.displayName = 'BusterThreadsProvider';

export const useBusterThreadsContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterThreads>, T>
) => {
  return useContextSelector(BusterThreads, selector);
};

export const useBusterThreadIndividual = ({ threadId }: { threadId: string }) => {
  const thread = useBusterThreadsContextSelector((x) => x.threads[threadId]);

  return {
    thread: resolveEmptyThread(thread, threadId)
  };
};

export const useBusterCurrentThreadMessage = ({
  threadId,
  messageId
}: {
  threadId: string;
  messageId?: string;
}): string => {
  const lastMessageId = useBusterThreadsContextSelector((x) => last(x.threads[threadId]?.messages));
  const contextSelectedId = useBusterThreadsContextSelector(
    (x) => x.currentMessageIdByThread[threadId]
  );
  const selectedMessageId = useMemo(
    () => messageId || contextSelectedId || lastMessageId || '',
    [messageId, contextSelectedId, lastMessageId]
  );

  return selectedMessageId;
};

export const useBusterThreadMessage = ({
  threadId,
  messageId
}: {
  threadId: string;
  messageId?: string;
}): { message: IBusterThreadMessage | null; selectedMessageId: string } => {
  const selectedMessageId = useBusterCurrentThreadMessage({ threadId, messageId });
  const message = useBusterThreadsContextSelector((x) => x.messages[selectedMessageId]);

  return {
    message,
    selectedMessageId
  };
};
