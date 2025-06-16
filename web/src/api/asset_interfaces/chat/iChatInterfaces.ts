import type { BusterChat } from './chatInterfaces';
import type { BusterChatMessage } from './chatMessageInterfaces';

export interface IBusterChat extends Omit<BusterChat, 'messages'> {
  isNewChat: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- temporary
export interface IBusterChatMessage extends BusterChatMessage {
  //
}
