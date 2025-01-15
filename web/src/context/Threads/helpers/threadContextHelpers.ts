import { BusterThreadMessage, BusterThread } from '@/api/buster-rest';
import { BusterMessageData, IBusterThread, IBusterThreadMessage } from '../interfaces';
import { createDefaultChartConfig } from './messageAutoChartHandler';

interface UpgradeMessageToIMessageParams {
  isCompleted?: boolean;
}

export const upgradeMessageToIMessage = (
  message: BusterThreadMessage,
  oldMessage: IBusterThreadMessage | null | undefined,
  d?: UpgradeMessageToIMessageParams
): IBusterThreadMessage => {
  const { isCompleted } = d ?? {};
  const chart_config = createDefaultChartConfig(message);

  const _isCompleted = isCompleted ?? oldMessage?.isCompleted ?? false;

  return {
    ...oldMessage,
    ...message,
    thoughts: {
      ...oldMessage?.thoughts,
      ...message.thoughts,
      completed: true
    },
    chart_config,
    isCompleted: _isCompleted
  };
};

/*
This function will previous the data from the old thread and upgrade the thread to the new thread format
*/
export const upgradeThreadToIThread = (
  thread: BusterThread,
  oldThread: IBusterThread | undefined,
  iBusterMessages: Record<string, IBusterThreadMessage>,
  props: {
    threadParams?: {
      isNewThread?: boolean;
      isFollowupMessage?: boolean;
      isInitialLoad?: boolean;
    };
    messageParams?: UpgradeMessageToIMessageParams;
  }
): {
  upgradedThread: IBusterThread;
  upgradedMessages: Record<string, IBusterThreadMessage>;
} => {
  const threadParams = props?.threadParams;
  const additionalParams = {
    isNewThread: threadParams?.isNewThread ?? oldThread?.isNewThread ?? false,
    isFollowupMessage: threadParams?.isFollowupMessage ?? oldThread?.isFollowupMessage ?? false,
    isInitialLoad: threadParams?.isInitialLoad ?? oldThread?.isInitialLoad ?? false,
    ...threadParams
  };

  const upgradedMessages: Record<string, IBusterThreadMessage> = {};
  const upgradedThread = {
    ...thread,
    ...additionalParams,
    messages: thread.messages.map((m) => {
      const messageId = m.id;
      const oldIMessage = iBusterMessages[messageId];
      const upgradedMessage = upgradeMessageToIMessage(m, oldIMessage, props.messageParams);
      upgradedMessages[messageId] = upgradedMessage;
      return messageId;
    })
  };

  return {
    upgradedThread,
    upgradedMessages
  };
};
