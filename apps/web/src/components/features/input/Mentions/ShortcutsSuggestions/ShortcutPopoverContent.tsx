import { useGetShortcut } from '@/api/buster_rest/shortcuts/queryRequests';
import type { MentionPopoverContentCallback } from '@/components/ui/inputs/MentionInput';
import { CircleSpinnerLoader } from '@/components/ui/loaders';
import { Paragraph } from '@/components/ui/typography/Paragraph';
import { Text } from '@/components/ui/typography/Text';

export const ShortcutPopoverContent: MentionPopoverContentCallback = ({ value }) => {
  const { data, isFetched } = useGetShortcut({ id: value });
  const shortcutName = data?.name;
  const instructions = data?.instructions;

  if (!isFetched) return null;

  return (
    <div className="p-3 flex flex-col space-y-3 w-[215px]">
      <Section title="Shortcut name">
        <BlockText type="text">{shortcutName}</BlockText>
      </Section>
      <Section title="Prompt">
        <BlockText type="paragraph">{instructions}</BlockText>
      </Section>
      <hr className="w-full border-t" />
      <Paragraph
        variant={'tertiary'}
        size={'sm'}
      >{`Use shortcuts for your repeatable workflows in Buster`}</Paragraph>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-y-1">
      <Text size={'xs'} variant={'secondary'} truncate>
        {title}
      </Text>
      {children}
    </div>
  );
};

const BlockText = ({
  children,
  type,
}: {
  children: React.ReactNode;
  type: 'text' | 'paragraph';
}) => {
  const TextComponent = type === 'text' ? Text : Paragraph;
  return (
    <div className="bg-item-select border py-1.5 px-2.5 rounded">
      <TextComponent size={'sm'} variant={'secondary'} className="line-clamp-10">
        {children}
      </TextComponent>
    </div>
  );
};
