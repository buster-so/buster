import { type Editor, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import type React from 'react';
import { Popover } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { MentionTriggerItem } from './MentionInput.types';

export type MentionPillAttributes<T = string> = Pick<
  MentionTriggerItem<T>,
  'label' | 'value' | 'doNotAddPipeOnSelect' | 'pillLabel'
> & { trigger: string };

export const MentionPill = <T extends string>({
  node,
  editor,
}: ReactNodeViewProps<MentionTriggerItem<T>>) => {
  const { trigger, label, value, pillLabel } = node.attrs as MentionPillAttributes;
  const pillStyling = editor.storage.mention.pillStylingByTrigger.get(trigger);
  const pillClassName =
    typeof pillStyling?.className === 'function'
      ? pillStyling.className(node.attrs as MentionPillAttributes<T>)
      : pillStyling?.className;
  const pillStyle =
    typeof pillStyling?.style === 'function'
      ? pillStyling.style(node.attrs as MentionPillAttributes<T>)
      : pillStyling?.style;

  return (
    <NodeViewWrapper
      as={node.attrs.as ?? 'span'}
      className={cn(
        'text-sm px-1.5 py-0.5',
        'bg-item-select hover:bg-item-hover-active hover:shadow transition-all border rounded w-fit',
        'cursor-pointer select-none',
        pillClassName
      )}
      style={pillStyle}
      contentEditable={false}
    >
      <PopoverWrapper trigger={trigger} editor={editor} value={value}>
        {pillLabel || label}
      </PopoverWrapper>
    </NodeViewWrapper>
  );
};

const PopoverWrapper = <T extends string>({
  children,
  trigger,
  editor,
  value,
}: {
  children: React.ReactNode;
  trigger: string;
  value: T;
  editor: Editor;
}) => {
  try {
    const PopoverContent = editor.commands.getPopoverByTrigger(trigger);
    if (!PopoverContent) return children;

    return (
      <Popover
        trigger="hover"
        align="start"
        side="bottom"
        sideOffset={8}
        content={<PopoverContent value={value} />}
        className="p-0"
      >
        {children}
      </Popover>
    );
  } catch (error) {
    console.error(error);
    return children;
  }
};
