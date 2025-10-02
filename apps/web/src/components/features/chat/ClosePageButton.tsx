import { Link } from '@tanstack/react-router';
import { SelectableButton } from '@/components/ui/buttons/SelectableButton';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { Xmark } from '../../ui/icons';

export const ClosePageButton = ({ isEmbed }: { isEmbed: boolean }) => {
  const chatId = useGetChatId() || '';

  return (
    <Link to={isEmbed ? '/embed/chat/$chatId' : '/app/chats/$chatId'} params={{ chatId }}>
      <SelectableButton selected={false} tooltipText="Close" icon={<Xmark />} />
    </Link>
  );
};
ClosePageButton.displayName = 'ClosePageButton';
