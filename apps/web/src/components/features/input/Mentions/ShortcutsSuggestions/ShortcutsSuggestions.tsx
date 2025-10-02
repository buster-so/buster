import type { ListShortcutsResponse, Shortcut } from '@buster/server-shared/shortcuts';
import { useNavigate } from '@tanstack/react-router';
import type { Editor } from '@tiptap/react';
import { useMemo, useRef } from 'react';
import { useDeleteShortcut } from '@/api/buster_rest/shortcuts/queryRequests';
import { Trash } from '@/components/ui/icons';
import PenWriting from '@/components/ui/icons/NucleoIconOutlined/pen-writing';
import Plus from '@/components/ui/icons/NucleoIconOutlined/plus';
import {
  createMentionSuggestionExtension,
  type MentionInputTriggerItem,
  MentionSecondaryContentDropdown,
  type MentionTriggerItem,
} from '@/components/ui/inputs/MentionInput';
import type {
  MentionInputSuggestionsProps,
  MentionInputSuggestionsRef,
} from '@/components/ui/inputs/MentionInputSuggestions';
import { Paragraph } from '@/components/ui/typography/Paragraph';
import { Text } from '@/components/ui/typography/Text';
import { ShortcutPopoverContent } from './ShortcutPopoverContent';

export const SHORTCUT_MENTION_TRIGGER = '/';

export const useCreateShortcutsMentionsSuggestions = (
  shortcuts: ListShortcutsResponse['shortcuts'],
  setOpenCreateShortcutModal: (open: boolean) => void
) => {
  const navigate = useNavigate();
  const createShortcutForMention = useCreateShortcutForMention();

  const currentItemsRef = useRef(shortcuts);

  currentItemsRef.current = shortcuts;

  return useMemo(
    () =>
      createMentionSuggestionExtension({
        trigger: SHORTCUT_MENTION_TRIGGER,
        items: ({ defaultQueryMentionsFilter, editor, query }) => {
          const shortcuts = currentItemsRef.current;
          const allItems: MentionInputTriggerItem[] = [];
          if (shortcuts.length > 0) {
            allItems.push({
              type: 'group',
              items: shortcuts.map((s) => createShortcutForMention(s, editor)),
              className: 'max-h-[300px] overflow-y-auto',
            });
            allItems.push({ type: 'separator' as const });
          }
          allItems.push(
            ...[
              {
                value: 'manageShortcuts',
                label: 'Manage shortcuts',
                icon: <PenWriting />,
                doNotAddPipeOnSelect: true,
                onSelect: () => {
                  navigate({
                    to: '/app/home/shortcuts',
                  });
                },
              },
              {
                value: 'createShortcut',
                label: 'Create shortcut',
                icon: <Plus />,
                doNotAddPipeOnSelect: true,
                onSelect: () => {
                  setOpenCreateShortcutModal(true);
                },
              },
            ]
          );
          return defaultQueryMentionsFilter(query, allItems);
        },
        popoverContent: ShortcutPopoverContent,
        popoverClassName: '',
        onChangeTransform: (v) => {
          const foundShortcut = shortcuts.find((shortcut) => shortcut.id === v.value);
          if (foundShortcut) {
            return foundShortcut.instructions;
          }
          return v.value;
        },
      }),
    [shortcuts, setOpenCreateShortcutModal]
  );
};

export const useCreateShortcutForMention = () => {
  // const navigate = useNavigate();
  // const { mutateAsync: deleteShortcut } = useDeleteShortcut();
  const createShortcutForMention = (
    shortcut: Shortcut,
    _editor?: Editor
  ): MentionTriggerItem<string> => {
    return {
      value: shortcut.id,
      labelMatches: [shortcut.name, shortcut.instructions],
      label: (
        <div className="flex flex-col space-y-1.5 py-1.5">
          <Text>{`${SHORTCUT_MENTION_TRIGGER}${shortcut.name}`}</Text>
          <Paragraph
            size={'xs'}
            variant={'secondary'}
            className="line-clamp-2"
            style={{ lineHeight: 'normal' }}
          >
            {shortcut.instructions}
          </Paragraph>
        </div>
      ),
      pillLabel: shortcut.name,
      // secondaryContent: (
      //   <MentionSecondaryContentDropdown
      //     items={[
      //       {
      //         label: 'Edit',
      //         icon: <PenWriting />,
      //         value: 'edit',
      //         onClick: () => {
      //           navigate({
      //             to: '/app/home/shortcuts',
      //             search: {
      //               shortcut_id: shortcut.id,
      //             },
      //           });
      //         },
      //       },
      //       {
      //         label: 'Delete',
      //         icon: <Trash />,
      //         value: 'delete',
      //         onClick: async () => {
      //           await deleteShortcut({ id: shortcut.id });
      //           //remove the trigger character from the editor
      //           editor?.commands.deleteRange({
      //             from: editor.state.selection.from - 1,
      //             to: editor.state.selection.from,
      //           });
      //         },
      //       },
      //     ]}
      //   />
      // ),
    };
  };

  return createShortcutForMention;
};
export const useShortcutsSuggestions = (
  _shortcuts: ListShortcutsResponse['shortcuts'],
  setOpenCreateShortcutModal: (open: boolean) => void,
  mentionInputSuggestionsRef: React.RefObject<MentionInputSuggestionsRef | null>
): MentionInputSuggestionsProps['suggestionItems'] => {
  const navigate = useNavigate();
  return useMemo(() => {
    const shortcutsItems: MentionInputSuggestionsProps['suggestionItems'] = [
      {
        type: 'item',
        value: 'manageShortcuts',
        label: 'Manage shortcuts',
        keywords: ['/', 'manage', 'shortcuts'],
        icon: <PenWriting />,
        onClick: () => {
          navigate({
            to: '/app/home/shortcuts',
          });
        },
        closeOnSelect: false,
        addValueToInput: false,
      },
      {
        type: 'item',
        value: 'createShortcut',
        label: 'Create shortcut',
        keywords: ['/', 'create', 'shortcut'],
        icon: <Plus />,
        onClick: () => {
          setOpenCreateShortcutModal(true);
        },
        closeOnSelect: false,
        addValueToInput: false,
      },
    ];
    // const shortcutsItems = shortcuts.map<MentionInputSuggestionsDropdownItem>((shortcut) => {
    //   return {
    //     type: 'item',
    //     value: shortcut.name,
    //     label: shortcut.name,
    //     popoverContent: <ShortcutSuggestionsPopoverContent shortcut={shortcut} />,
    //     icon: SHORTCUT_MENTION_TRIGGER,
    //     inputValue: `${SHORTCUT_MENTION_TRIGGER} ${shortcut.name}`,
    //     onClick: () => {
    //       const addMentionToInput = mentionInputSuggestionsRef.current?.addMentionToInput;
    //       if (!addMentionToInput) {
    //         console.warn('addMentionToInput is not defined', mentionInputSuggestionsRef.current);
    //         return;
    //       }
    //       const shortcutForMention = createShortcutForMention(shortcut);
    //       addMentionToInput?.({
    //         ...shortcutForMention,
    //         trigger: SHORTCUT_MENTION_TRIGGER,
    //       });
    //     },
    //   };
    // });

    return shortcutsItems;

    // return [
    //   {
    //     type: 'group',
    //     label: 'Shortcuts',
    //     suggestionItems: shortcutsItems,
    //     addValueToInput: false,
    //     closeOnSelect: true,
    //   },
    // ];
  }, [setOpenCreateShortcutModal, mentionInputSuggestionsRef]);
};
