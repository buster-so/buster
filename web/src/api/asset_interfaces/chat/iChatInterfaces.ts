import type { BusterChat } from './chatInterfaces';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IBusterChat extends Omit<BusterChat, 'messages'> {
  //
}
