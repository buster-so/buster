import type { MessageAnalysisMode } from '@buster/server-shared/chats';
import type { ListShortcutsResponse } from '@buster/server-shared/shortcuts';
import type { GetSuggestedPromptsResponse } from '@buster/server-shared/user';
import React, { useMemo, useRef, useState } from 'react';
import {
  useCreateShortcutsMentionsSuggestions,
  useShortcutsSuggestions,
} from '@/components/features/input/Mentions/ShortcutsSuggestions/ShortcutsSuggestions';
import type {
  MentionArrayItem,
  MentionSuggestionExtension,
} from '@/components/ui/inputs/MentionInput';
import type {
  MentionInputSuggestionsOnSelectParams,
  MentionInputSuggestionsProps,
  MentionInputSuggestionsRef,
} from '@/components/ui/inputs/MentionInputSuggestions';
import { MentionInputSuggestions } from '@/components/ui/inputs/MentionInputSuggestions';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useMount } from '@/hooks/useMount';
import { NewShortcutModal } from '../../modals/NewShortcutModal';
import { BusterChatInputButtons } from './BusterChatInputButtons';
import { useUniqueSuggestions } from './useUniqueSuggestions';

export type BusterChatInputProps = {
  defaultValue: string;
  onSubmit: (d: {
    transformedValue: string;
    arrayValue: MentionArrayItem[];
    editorText: string;
    mode: MessageAnalysisMode;
  }) => void;
  onStop: () => void;
  submitting: boolean;
  disabled: boolean;
  shortcuts: ListShortcutsResponse['shortcuts'];
  suggestedPrompts: GetSuggestedPromptsResponse['suggestedPrompts'];
  autoSubmit?: boolean;
};

export const BusterChatInputBase: React.FC<BusterChatInputProps> = React.memo(
  ({
    defaultValue,
    onSubmit,
    onStop,
    autoSubmit,
    submitting,
    disabled,
    shortcuts,
    suggestedPrompts,
  }) => {
    const mentionInputSuggestionsRef = useRef<MentionInputSuggestionsRef>(null);
    const uniqueSuggestions = useUniqueSuggestions(suggestedPrompts);
    const [openCreateShortcutModal, setOpenCreateShortcutModal] = useState(false);
    const [mode, setMode] = useState<MessageAnalysisMode>('auto');
    const { openInfoMessage } = useBusterNotifications();

    const shortcutsSuggestions = useShortcutsSuggestions(
      shortcuts,
      setOpenCreateShortcutModal,
      mentionInputSuggestionsRef
    );

    const suggestionItems: MentionInputSuggestionsProps['suggestionItems'] = useMemo(() => {
      const items: MentionInputSuggestionsProps['suggestionItems'] = [...uniqueSuggestions];

      if (items.length > 0 && shortcutsSuggestions.length > 0) {
        items.push({
          type: 'separator',
        });
      }

      if (shortcutsSuggestions.length > 0) {
        items.push(...shortcutsSuggestions);
      }

      return items;
    }, [uniqueSuggestions, shortcutsSuggestions]);

    const shortcutsMentionsSuggestions = useCreateShortcutsMentionsSuggestions(
      shortcuts,
      setOpenCreateShortcutModal
    );

    const mentions: MentionSuggestionExtension[] = useMemo(() => {
      return [shortcutsMentionsSuggestions];
    }, [shortcutsMentionsSuggestions]);

    const onSubmitPreflight = useMemoizedFn(
      (valueProp?: ReturnType<MentionInputSuggestionsRef['getValue']>) => {
        if (submitting) {
          console.warn('Input is submitting');
          return;
        }

        const value = valueProp || mentionInputSuggestionsRef.current?.getValue?.();
        if (!value) {
          console.warn('Value is not defined');
          return;
        }

        if (disabled || !value || !value.transformedValue) {
          console.warn('Input is disabled or value is not defined');
          openInfoMessage('Please enter a question or type ‘/’ for shortcuts...');
          return;
        }

        onSubmit({ ...value, mode });
      }
    );

    const onSuggestionItemClick = useMemoizedFn((d: MentionInputSuggestionsOnSelectParams) => {
      if (d.addValueToInput) {
        onSubmitPreflight();
      }
    });

    const onCloseCreateShortcutModal = useMemoizedFn(() => {
      setOpenCreateShortcutModal(false);
    });

    useMount(() => {
      if (autoSubmit && defaultValue) {
        onSubmitPreflight({
          transformedValue: defaultValue,
          arrayValue: [],
          editorText: defaultValue,
        });
      }
    });

    return (
      <React.Fragment>
        <MentionInputSuggestions
          defaultValue={defaultValue}
          onPressEnter={onSubmitPreflight}
          onSuggestionItemClick={onSuggestionItemClick}
          mentions={mentions}
          suggestionItems={suggestionItems}
          disabled={disabled}
          placeholder="Ask a question or type ‘/’ for shortcuts..."
          ref={mentionInputSuggestionsRef}
          inputContainerClassName="px-5 pt-4"
          inputClassName="text-md"
          behavior="open-on-focus"
        >
          <BusterChatInputButtons
            onSubmit={onSubmitPreflight}
            onStop={onStop}
            submitting={submitting}
            disabled={disabled}
            mode={mode}
            onModeChange={setMode}
          />
        </MentionInputSuggestions>

        <NewShortcutModal open={openCreateShortcutModal} onClose={onCloseCreateShortcutModal} />
      </React.Fragment>
    );
  }
);

BusterChatInputBase.displayName = 'BusterChatInputBase';
