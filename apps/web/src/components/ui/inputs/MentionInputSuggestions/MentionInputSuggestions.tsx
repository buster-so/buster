import { Command, useCommandState } from 'cmdk';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useMounted } from '@/hooks/useMount';
import { cn } from '@/lib/utils';
import type { MentionInputProps, MentionInputRef } from '../MentionInput';
import type {
  MentionInputSuggestionsOnSelectParams,
  MentionInputSuggestionsProps,
  MentionInputSuggestionsRef,
} from './MentionInputSuggestions.types';
import { MentionInputSuggestionsContainer } from './MentionInputSuggestionsContainer';
import { MentionInputSuggestionsEmpty } from './MentionInputSuggestionsEmpty';
import { MentionInputSuggestionsItemsSelector } from './MentionInputSuggestionsItemSelector';
import { MentionInputSuggestionsList } from './MentionInputSuggestionsList';
import { MentionInputSuggestionsMentionsInput } from './MentionInputSuggestionsMentionsInput';

export const MentionInputSuggestions = forwardRef<
  MentionInputSuggestionsRef,
  MentionInputSuggestionsProps
>(
  (
    {
      placeholder,
      defaultValue,
      value: valueProp,
      emptyComponent,
      submitting,
      onPressEnter,
      disabled = false,
      onChange,
      ariaLabel = 'Mention Input Suggestions',
      readOnly,
      autoFocus,
      children,
      //container
      className,
      inputContainerClassName,
      suggestionsContainerClassName,
      inputClassName,
      //suggestions
      suggestionItems,
      closeSuggestionOnSelect = true,
      addSuggestionValueToInput = true,
      onSuggestionItemClick,
      filter,
      shouldFilter,
      //mentions
      onMentionItemClick,
      mentions,
      behavior = 'default',
    }: MentionInputSuggestionsProps,
    ref
  ) => {
    const [hasClickedSelect, setHasClickedSelect] = useState(false);
    const [isInteracting, setIsInteracting] = useState(behavior === 'default');
    const [value, setValue] = useState(valueProp ?? defaultValue);

    const commandListNavigatedRef = useRef(false);
    const commandRef = useRef<HTMLDivElement>(null);
    const mentionsInputRef = useRef<MentionInputRef>(null);

    const showSuggestionList =
      behavior === 'default'
        ? !hasClickedSelect && suggestionItems.length > 0
        : isInteracting && suggestionItems.length > 0;

    // biome-ignore lint/style/noNonNullAssertion: we know the ref is not null
    const getValue = mentionsInputRef.current?.getValue!;
    // biome-ignore lint/style/noNonNullAssertion: we know the ref is not null
    const addMentionToInput = mentionsInputRef.current?.addMentionToInput!;
    const mounted = useMounted();

    const onChangeInputValue: MentionInputProps['onChange'] = useCallback(
      (d) => {
        const { transformedValue } = d;
        setValue(transformedValue);
        onChange?.(d);
        commandListNavigatedRef.current = false;
        setHasClickedSelect(false);
        setIsInteracting(true);
      },
      [onChange, setHasClickedSelect, setIsInteracting]
    );

    //Exported: this is used to change the value of the input from outside the component
    const onChangeValue = useMemoizedFn((v: string | ((prevState: string) => string)) => {
      if (typeof v === 'function') {
        setValue((prevState) => {
          const newState = v(prevState);
          mentionsInputRef.current?.editor?.commands.setContent(newState);
          return newState;
        });
      } else {
        setValue(v);
        mentionsInputRef.current?.editor?.commands.setContent(v);
      }
    });

    const onSelectItem = useMemoizedFn(
      ({ onClick, ...params }: MentionInputSuggestionsOnSelectParams) => {
        const { addValueToInput, loading, label, disabled, inputValue } = params;
        if (disabled) {
          console.warn('Item is disabled', params);
          return;
        }
        if (submitting) {
          console.warn('Input is submitting');
          return;
        }
        if (loading) {
          console.warn('Item is loading', params);
          return;
        }
        if (addValueToInput) {
          const stringValue = inputValue ?? String(label);
          mentionsInputRef.current?.editor?.commands.setContent(stringValue);
          setValue(stringValue);
        }
        onClick?.();
        onSuggestionItemClick?.(params);

        if (closeSuggestionOnSelect && params.closeOnSelect !== false) setHasClickedSelect(true);
        requestAnimationFrame(() => {
          setIsInteracting(false);
        });
      }
    );

    const onBlur = useMemoizedFn(() => {
      setIsInteracting(false);
    });

    // Track arrow key navigation in the command list
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Check if a mention popover is currently open (it's appended to document.body with data-testid="mention-list")
        const mentionListOpen = document.querySelector('[data-testid="mention-list"]');

        // If mention popover is open, let Tiptap handle all keyboard events (higher priority)
        if (mentionListOpen) {
          return;
        }

        if (showSuggestionList && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
          commandListNavigatedRef.current = true;
        }

        // If Enter is pressed and command list was navigated, manually trigger selection
        if (showSuggestionList && event.key === 'Enter' && commandListNavigatedRef.current) {
          event.preventDefault();
          event.stopPropagation();
          // Find the currently selected item and trigger its click
          const selectedItem = commandElement?.querySelector(
            '[data-selected="true"]'
          ) as HTMLElement;
          if (selectedItem) {
            selectedItem.click();
          }
        }
      };
      const commandElement = commandRef.current;
      if (commandElement) {
        commandElement.addEventListener('keydown', handleKeyDown, true); // Use capture phase
        return () => {
          commandElement.removeEventListener('keydown', handleKeyDown, true);
        };
      }
    }, [showSuggestionList]);

    useImperativeHandle(
      ref,
      () => ({
        value,
        onChangeValue,
        getValue,
        addMentionToInput,
      }),
      [value, mounted, onChangeValue, getValue, addMentionToInput]
    );

    return (
      <MentionInputSuggestionsProvider
        value={value}
        onChangeValue={onChangeValue}
        getValue={getValue}
      >
        <Command
          ref={commandRef}
          label={ariaLabel}
          className={cn(
            'relative border rounded-xl overflow-hidden bg-background shadow',
            // CSS-only solution: Hide separators that come after hidden elements
            '[&_[hidden]+[data-separator-after-hidden]]:hidden',
            className
          )}
          shouldFilter={shouldFilter}
          filter={filter || customFilter}
          onClick={() => {
            setIsInteracting(true);
          }}
        >
          <MentionInputSuggestionsContainer className={inputContainerClassName}>
            <MentionInputSuggestionsMentionsInput
              ref={mentionsInputRef}
              defaultValue={defaultValue}
              readOnly={readOnly}
              autoFocus={autoFocus}
              placeholder={placeholder}
              mentions={mentions}
              value={value}
              onChange={onChangeInputValue}
              onMentionItemClick={onMentionItemClick}
              onPressEnter={onPressEnter}
              commandListNavigatedRef={commandListNavigatedRef}
              disabled={disabled}
              className={inputClassName}
              onBlur={onBlur}
            />
            {children && <div className="mt-6">{children}</div>}
          </MentionInputSuggestionsContainer>
          <SuggestionsSeperator />
          <MentionInputSuggestionsList
            show={showSuggestionList}
            className={cn('px-3 overflow-y-auto max-h-[35vh]', suggestionsContainerClassName)}
          >
            <MentionInputSuggestionsItemsSelector
              suggestionItems={suggestionItems}
              onSelect={onSelectItem}
              addValueToInput={addSuggestionValueToInput}
              closeOnSelect={closeSuggestionOnSelect}
            />

            <MentionInputSuggestionsEmpty emptyComponent={emptyComponent} />
          </MentionInputSuggestionsList>
        </Command>
      </MentionInputSuggestionsProvider>
    );
  }
);

MentionInputSuggestions.displayName = 'MentionInputSuggestions';

const MentionInputSuggestionsContext = createContext<{
  value: string;
  onChangeValue: MentionInputSuggestionsRef['onChangeValue'];
  getValue: MentionInputSuggestionsRef['getValue'];
}>({} as MentionInputSuggestionsRef);

const MentionInputSuggestionsProvider = ({
  children,
  value,
  onChangeValue,
  getValue,
}: {
  children: React.ReactNode;
  value: string;
  onChangeValue: MentionInputSuggestionsRef['onChangeValue'];
  getValue: MentionInputSuggestionsRef['getValue'];
}) => {
  return (
    <MentionInputSuggestionsContext.Provider value={{ onChangeValue, value, getValue }}>
      {children}
    </MentionInputSuggestionsContext.Provider>
  );
};

const stableSelector = (x: { value: string }) => x.value.length > 0;
export const useMentionInputHasValue = () => {
  const hasValue = useContextSelector(MentionInputSuggestionsContext, stableSelector);
  return hasValue;
};

const stableSelectorGetValue = (x: { getValue: MentionInputSuggestionsRef['getValue'] }) =>
  x.getValue;
export const useMentionInputSuggestionsGetValue = () => {
  const getValue = useContextSelector(MentionInputSuggestionsContext, stableSelectorGetValue);
  return getValue;
};

const stableSelectorOnChangeValue = (x: {
  onChangeValue: MentionInputSuggestionsRef['onChangeValue'];
}) => x.onChangeValue;
export const useMentionInputSuggestionsOnChangeValue = () => {
  const onChangeValue = useContextSelector(
    MentionInputSuggestionsContext,
    stableSelectorOnChangeValue
  );
  return onChangeValue;
};

const SuggestionsSeperator = () => {
  const hasResults = useCommandState((x) => x.filtered.count) > 0;
  if (!hasResults) return null;
  return <div className="border-b" />;
};

const customFilter = (value: string, search: string, keywords?: string[]): number => {
  if (keywords?.length) {
    return keywords.includes(value) ? 2 : 0;
  }
  // Example: exact matches rank higher, case insensitive includes rank lower
  if (value.toLowerCase() === search.toLowerCase()) return 2;
  if (value.toLowerCase().includes(search.toLowerCase())) return 1;
  return 0;
};
