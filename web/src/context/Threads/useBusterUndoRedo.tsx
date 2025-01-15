import { IBusterThreadMessageChartConfig } from '@/api/buster-rest';
import { useMemoizedFn } from 'ahooks';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useBusterThreadsContextSelector } from './BusterThreadsProvider';
import { IBusterThreadMessage } from './interfaces';

type IUndoRedoStackItem =
  | { messageId: string; type: 'selectedMessageId' }
  | { messageId: string; type: 'chartConfig'; chartConfig: IBusterThreadMessageChartConfig };

interface IUndoRedoStack {
  undo: IUndoRedoStackItem[];
  redo: IUndoRedoStackItem[];
}

export const useBusterUndoRedo = ({
  getSearchMessageId,
  currentMessageIdByThread,
  messagesRef,
  onSetCurrentMessageId,
  onUpdateMessageChartConfig
}: {
  getSearchMessageId: ({ threadId, messageId }: { threadId: string; messageId?: string }) => string;
  onSetCurrentMessageId: ({ threadId, messageId }: { threadId: string; messageId: string }) => void;
  onUpdateMessageChartConfig: (d: {
    threadId?: string;
    messageId?: string;
    chartConfig: Partial<IBusterThreadMessageChartConfig>;
    ignoreUndoRedo?: boolean;
  }) => Promise<void>;
  currentMessageIdByThread: { [key: string]: string | null };
  messagesRef: React.MutableRefObject<Record<string, IBusterThreadMessage>>;
}) => {
  //keyed by threadId
  const [undoRedoStack, setUndoRedoStack] = useState<Record<string, IUndoRedoStack>>({});

  const onUndo = useMemoizedFn(({ threadId }: { threadId: string }) => {
    if (undoRedoStack[threadId]?.undo.length === 0) {
      return;
    }

    const itemToUndo = undoRedoStack[threadId].undo[undoRedoStack[threadId].undo.length - 1];
    const newUndoStack = undoRedoStack[threadId].undo.slice(0, -1);

    let redoItem: IUndoRedoStackItem;
    if (itemToUndo.type === 'selectedMessageId') {
      redoItem = {
        type: 'selectedMessageId',
        messageId: currentMessageIdByThread[threadId] || ''
      };
    } else {
      redoItem = {
        type: 'chartConfig',
        messageId: itemToUndo.messageId,
        chartConfig: messagesRef.current[itemToUndo.messageId].chart_config
      };
    }

    setUndoRedoStack({
      ...undoRedoStack,
      [threadId]: {
        undo: newUndoStack,
        redo: [...(undoRedoStack[threadId]?.redo || []), redoItem]
      }
    });

    if (itemToUndo.type === 'selectedMessageId') {
      onSetCurrentMessageId({ threadId, messageId: itemToUndo.messageId });
    } else if (itemToUndo.type === 'chartConfig') {
      onUpdateMessageChartConfig({
        threadId,
        messageId: itemToUndo.messageId,
        chartConfig: itemToUndo.chartConfig,
        ignoreUndoRedo: true
      });
    }
  });

  const onRedo = useMemoizedFn(({ threadId }: { threadId: string }) => {
    if (undoRedoStack[threadId]?.redo.length === 0) {
      return;
    }

    const itemToRedo = undoRedoStack[threadId].redo[undoRedoStack[threadId].redo.length - 1];
    const newRedoStack = undoRedoStack[threadId].redo.slice(0, -1);

    let undoItem: IUndoRedoStackItem;
    if (itemToRedo.type === 'selectedMessageId') {
      undoItem = {
        type: 'selectedMessageId',
        messageId: currentMessageIdByThread[threadId] || ''
      };
    } else {
      undoItem = {
        type: 'chartConfig',
        messageId: itemToRedo.messageId,
        chartConfig: messagesRef.current[itemToRedo.messageId].chart_config
      };
    }

    setUndoRedoStack({
      ...undoRedoStack,
      [threadId]: {
        undo: [...(undoRedoStack[threadId]?.undo || []), undoItem],
        redo: newRedoStack
      }
    });

    if (itemToRedo.type === 'selectedMessageId') {
      onSetCurrentMessageId({ threadId, messageId: itemToRedo.messageId });
    } else if (itemToRedo.type === 'chartConfig') {
      onUpdateMessageChartConfig({
        threadId,
        messageId: itemToRedo.messageId,
        chartConfig: itemToRedo.chartConfig,
        ignoreUndoRedo: true
      });
    }
  });

  const addToUndoStack = useMemoizedFn(
    ({
      threadId,
      messageId,
      chartConfig
    }: {
      threadId: string;
      messageId: string;
      chartConfig?: IBusterThreadMessageChartConfig;
    }) => {
      const type = chartConfig ? 'chartConfig' : 'selectedMessageId';
      const newItem: IUndoRedoStackItem =
        type === 'selectedMessageId'
          ? {
              messageId,
              type: 'selectedMessageId'
            }
          : {
              messageId,
              type: 'chartConfig',
              chartConfig: chartConfig!
            };

      setUndoRedoStack((v) => ({
        ...v,
        [threadId]: {
          undo: [...(v[threadId]?.undo || []), newItem],
          redo: []
        }
      }));
    }
  );

  const canUndo = useMemo(() => {
    return (threadId: string) => {
      if (undoRedoStack[threadId]) return undoRedoStack[threadId]?.undo.length > 0;
      return false;
    };
  }, [undoRedoStack]);

  const canRedo = useMemo(() => {
    return (threadId: string) => {
      if (undoRedoStack[threadId]) return undoRedoStack[threadId]?.redo.length > 0;
      return false;
    };
  }, [undoRedoStack]);

  const resetUndoRedoStack = useMemoizedFn(() => {
    setUndoRedoStack({});
  });

  return {
    onUndo,
    onRedo,
    addToUndoStack,
    canRedo,
    resetUndoRedoStack,
    canUndo
  };
};
