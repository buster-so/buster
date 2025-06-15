import { BusterChat, BusterChatMessage } from '../../asset_interfaces';
import { mainApiV2 } from '../instances';
import { type ChatCreateRequest, ChatCreateResponse } from '@server/types/chat.types';

export const startNewChat = async (props: ChatCreateRequest): Promise<BusterChat> => {
  const response = await mainApiV2.api.v2.chats.$post({ json: props }).then((res) => res.json());

  const message1: BusterChatMessage = response.messages[0];

  return response;
};
