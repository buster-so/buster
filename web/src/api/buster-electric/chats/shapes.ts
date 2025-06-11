import { type BusterChat } from '@/api/asset_interfaces/chat';
import { type ElectricShapeOptions } from '../instances';

export type BusterChatWithoutMessages = Omit<BusterChat, 'messages' | 'message_ids'>;

const columns = [
  'id',
  'title',
  'most_recent_file_id',
  'most_recent_file_type',
  'most_recent_version_number'
];

export const chatShape = ({
  chatId
}: {
  chatId: string;
}): ElectricShapeOptions<BusterChatWithoutMessages> => {
  return {
    params: { table: 'chats', where: `id='${chatId}'`, columns }
  };
};
