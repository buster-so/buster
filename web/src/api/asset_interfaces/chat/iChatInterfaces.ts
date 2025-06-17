import type { BusterChat } from './chatInterfaces';
import type { BusterChatMessage } from './chatMessageInterfaces';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IBusterChat extends Omit<BusterChat, 'messages'> {
  //
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- temporary
export interface IBusterChatMessage extends BusterChatMessage {
  //
}
