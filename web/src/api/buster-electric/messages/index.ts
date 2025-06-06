import { useShape } from '../instances';

export const useGetMessages = ({ chatId }: { chatId: string }) => {
  return useShape({
    params: {
      table: 'messages',
      where: `chat_id = '${chatId}'`
    }
  });
};
