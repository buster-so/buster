'use client';

import * as React from 'react';

import type { Emoji } from '@emoji-mart/data';

import {
  type EmojiCategoryList,
  type EmojiIconList,
  type GridRow,
  EmojiSettings
} from '@platejs/emoji';
import {
  type EmojiDropdownMenuOptions,
  type UseEmojiPickerType,
  useEmojiDropdownMenuState
} from '@platejs/emoji/react';
import * as Popover from '@radix-ui/react-popover';
import {
  Apple,
  Flag,
  Magnifier,
  Leaf,
  Lightbulb,
  Music,
  Star,
  Xmark,
  FaceGrin,
  Clock,
  Compass,
  BallRugby
} from '../../icons';

import { Button } from '@/components/ui/buttons';
import {
  Tooltip,
  TooltipBase,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ToolbarButton } from '@/components/ui/toolbar';

export function EmojiToolbarButton({
  options,
  ...props
}: {
  options?: EmojiDropdownMenuOptions;
} & React.ComponentPropsWithoutRef<typeof ToolbarButton>) {
  const { emojiPickerState, isOpen, setIsOpen } = useEmojiDropdownMenuState(options);

  return (
    <EmojiPopover
      control={
        <ToolbarButton pressed={isOpen} tooltip="Emoji" isDropdown {...props}>
          <div>
            <FaceGrin />
          </div>
        </ToolbarButton>
      }
      isOpen={isOpen}
      setIsOpen={setIsOpen}>
      <EmojiPicker
        {...emojiPickerState}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        settings={options?.settings}
      />
    </EmojiPopover>
  );
}

export function EmojiPopover({
  children,
  control,
  isOpen,
  setIsOpen
}: {
  children: React.ReactNode;
  control: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>{control}</Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="z-100">{children}</Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function EmojiPicker({
  clearSearch,
  emoji,
  emojiLibrary,
  focusedCategory,
  hasFound,
  i18n,
  icons = {
    categories: emojiCategoryIcons,
    search: emojiSearchIcons
  },
  isSearching,
  refs,
  searchResult,
  searchValue,
  setSearch,
  settings = EmojiSettings,
  visibleCategories,
  handleCategoryClick,
  onMouseOver,
  onSelectEmoji
}: Omit<UseEmojiPickerType, 'icons'> & {
  icons?: EmojiIconList<React.ReactElement>;
}) {
  return (
    <div
      className={cn(
        'bg-popover text-popover-foreground flex flex-col rounded-xl',
        'h-[23rem] w-80 border shadow-md'
      )}>
      <EmojiPickerNavigation
        onClick={handleCategoryClick}
        emojiLibrary={emojiLibrary}
        focusedCategory={focusedCategory}
        i18n={i18n}
        icons={icons}
      />
      <EmojiPickerSearchBar i18n={i18n} searchValue={searchValue} setSearch={setSearch}>
        <EmojiPickerSearchAndClear
          clearSearch={clearSearch}
          i18n={i18n}
          searchValue={searchValue}
        />
      </EmojiPickerSearchBar>
      <EmojiPickerContent
        onMouseOver={onMouseOver}
        onSelectEmoji={onSelectEmoji}
        emojiLibrary={emojiLibrary}
        i18n={i18n}
        isSearching={isSearching}
        refs={refs}
        searchResult={searchResult}
        settings={settings}
        visibleCategories={visibleCategories}
      />
      <EmojiPickerPreview emoji={emoji} hasFound={hasFound} i18n={i18n} isSearching={isSearching} />
    </div>
  );
}

const EmojiButton = React.memo(function EmojiButton({
  emoji,
  index,
  onMouseOver,
  onSelect
}: {
  emoji: Emoji;
  index: number;
  onMouseOver: (emoji?: Emoji) => void;
  onSelect: (emoji: Emoji) => void;
}) {
  return (
    <button
      className="group relative flex size-9 cursor-pointer items-center justify-center border-none bg-transparent text-2xl leading-none"
      onClick={() => onSelect(emoji)}
      onMouseEnter={() => onMouseOver(emoji)}
      onMouseLeave={() => onMouseOver()}
      aria-label={emoji.skins[0].native}
      data-index={index}
      tabIndex={-1}
      type="button">
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
        aria-hidden="true"
      />
      <span
        className="relative"
        style={{
          fontFamily:
            '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols'
        }}
        data-emoji-set="native">
        {emoji.skins[0].native}
      </span>
    </button>
  );
});

const RowOfButtons = React.memo(function RowOfButtons({
  emojiLibrary,
  row,
  onMouseOver,
  onSelectEmoji
}: {
  row: GridRow;
} & Pick<UseEmojiPickerType, 'emojiLibrary' | 'onMouseOver' | 'onSelectEmoji'>) {
  return (
    <div key={row.id} className="flex" data-index={row.id}>
      {row.elements.map((emojiId, index) => (
        <EmojiButton
          key={emojiId}
          onMouseOver={onMouseOver}
          onSelect={onSelectEmoji}
          emoji={emojiLibrary.getEmoji(emojiId)}
          index={index}
        />
      ))}
    </div>
  );
});

function EmojiPickerContent({
  emojiLibrary,
  i18n,
  isSearching = false,
  refs,
  searchResult,
  settings = EmojiSettings,
  visibleCategories,
  onMouseOver,
  onSelectEmoji
}: Pick<
  UseEmojiPickerType,
  | 'emojiLibrary'
  | 'i18n'
  | 'isSearching'
  | 'onMouseOver'
  | 'onSelectEmoji'
  | 'refs'
  | 'searchResult'
  | 'settings'
  | 'visibleCategories'
>) {
  const getRowWidth = settings.perLine.value * settings.buttonSize.value;

  const isCategoryVisible = React.useCallback(
    (categoryId: EmojiCategoryList) => {
      return visibleCategories.has(categoryId) ? visibleCategories.get(categoryId) : false;
    },
    [visibleCategories]
  );

  const EmojiList = React.useCallback(() => {
    return emojiLibrary
      .getGrid()
      .sections()
      .map(({ id: categoryId }) => {
        const section = emojiLibrary.getGrid().section(categoryId);
        const { buttonSize } = settings;

        return (
          <div
            key={categoryId}
            ref={section.root as React.RefObject<HTMLDivElement>}
            style={{ width: getRowWidth }}
            data-id={categoryId}>
            <div className="bg-popover/90 sticky -top-px z-1 p-1 py-2 text-sm font-semibold backdrop-blur-xs">
              {i18n.categories[categoryId]}
            </div>
            <div
              className="relative flex flex-wrap"
              style={{ height: section.getRows().length * buttonSize.value }}>
              {isCategoryVisible(categoryId) &&
                section
                  .getRows()
                  .map((row: GridRow) => (
                    <RowOfButtons
                      key={row.id}
                      onMouseOver={onMouseOver}
                      onSelectEmoji={onSelectEmoji}
                      emojiLibrary={emojiLibrary}
                      row={row}
                    />
                  ))}
            </div>
          </div>
        );
      });
  }, [
    emojiLibrary,
    getRowWidth,
    i18n.categories,
    isCategoryVisible,
    onSelectEmoji,
    onMouseOver,
    settings
  ]);

  const SearchList = React.useCallback(() => {
    return (
      <div style={{ width: getRowWidth }} data-id="search">
        <div className="bg-popover/90 text-card-foreground sticky -top-px z-1 p-1 py-2 text-sm font-semibold backdrop-blur-xs">
          {i18n.searchResult}
        </div>
        <div className="relative flex flex-wrap">
          {searchResult.map((emoji: Emoji, index: number) => (
            <EmojiButton
              key={emoji.id}
              onMouseOver={onMouseOver}
              onSelect={onSelectEmoji}
              emoji={emojiLibrary.getEmoji(emoji.id)}
              index={index}
            />
          ))}
        </div>
      </div>
    );
  }, [emojiLibrary, getRowWidth, i18n.searchResult, searchResult, onSelectEmoji, onMouseOver]);

  return (
    <div
      ref={refs.current.contentRoot as React.RefObject<HTMLDivElement>}
      className={cn(
        'h-full min-h-[50%] overflow-x-hidden overflow-y-auto px-2',
        '[&::-webkit-scrollbar]:w-4',
        '[&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-button]:size-0',
        '[&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/25 [&::-webkit-scrollbar-thumb]:min-h-11 [&::-webkit-scrollbar-thumb]:rounded-full',
        '[&::-webkit-scrollbar-thumb]:border-popover [&::-webkit-scrollbar-thumb]:border-4 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:bg-clip-padding'
      )}
      data-id="scroll">
      <div ref={refs.current.content as React.RefObject<HTMLDivElement>} className="h-full">
        {isSearching ? SearchList() : EmojiList()}
      </div>
    </div>
  );
}

function EmojiPickerSearchBar({
  children,
  i18n,
  searchValue,
  setSearch
}: {
  children: React.ReactNode;
} & Pick<UseEmojiPickerType, 'i18n' | 'searchValue' | 'setSearch'>) {
  return (
    <div className="flex items-center px-2">
      <div className="relative flex grow items-center">
        <input
          className="bg-muted placeholder:text-muted-foreground block w-full appearance-none rounded-full border-0 px-10 py-2 text-sm outline-none focus-visible:outline-none"
          value={searchValue}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={i18n.search}
          aria-label="Search"
          autoComplete="off"
          type="text"
          autoFocus
        />
        {children}
      </div>
    </div>
  );
}

function EmojiPickerSearchAndClear({
  clearSearch,
  i18n,
  searchValue
}: Pick<UseEmojiPickerType, 'clearSearch' | 'i18n' | 'searchValue'>) {
  return (
    <div className="text-foreground flex items-center">
      <div
        className={cn(
          'text-foreground absolute top-1/2 left-2.5 z-10 flex size-5 -translate-y-1/2 items-center justify-center'
        )}>
        {emojiSearchIcons.loupe}
      </div>
      {searchValue && (
        <Button
          variant="ghost"
          className={cn(
            'text-popover-foreground absolute top-1/2 right-0.5 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-transparent hover:bg-transparent'
          )}
          onClick={clearSearch}
          title={i18n.clear}
          aria-label="Clear"
          type="button"
          prefix={emojiSearchIcons.delete}
        />
      )}
    </div>
  );
}

function EmojiPreview({ emoji }: Pick<UseEmojiPickerType, 'emoji'>) {
  return (
    <div className="border-muted flex h-14 max-h-14 min-h-14 items-center border-t p-2">
      <div className="flex items-center justify-center text-2xl">{emoji?.skins[0].native}</div>
      <div className="overflow-hidden pl-2">
        <div className="truncate text-sm font-semibold">{emoji?.name}</div>
        <div className="truncate text-sm">{`:${emoji?.id}:`}</div>
      </div>
    </div>
  );
}

function NoEmoji({ i18n }: Pick<UseEmojiPickerType, 'i18n'>) {
  return (
    <div className="border-muted flex h-14 max-h-14 min-h-14 items-center border-t p-2">
      <div className="flex items-center justify-center text-2xl">😢</div>
      <div className="overflow-hidden pl-2">
        <div className="truncate text-sm font-bold">{i18n.searchNoResultsTitle}</div>
        <div className="truncate text-sm">{i18n.searchNoResultsSubtitle}</div>
      </div>
    </div>
  );
}

function PickAnEmoji({ i18n }: Pick<UseEmojiPickerType, 'i18n'>) {
  return (
    <div className="border-muted flex h-14 max-h-14 min-h-14 items-center border-t p-2">
      <div className="flex items-center justify-center text-2xl">☝️</div>
      <div className="overflow-hidden pl-2">
        <div className="truncate text-sm font-semibold">{i18n.pick}</div>
      </div>
    </div>
  );
}

function EmojiPickerPreview({
  emoji,
  hasFound = true,
  i18n,
  isSearching = false,
  ...props
}: Pick<UseEmojiPickerType, 'emoji' | 'hasFound' | 'i18n' | 'isSearching'>) {
  const showPickEmoji = !emoji && (!isSearching || hasFound);
  const showNoEmoji = isSearching && !hasFound;
  const showPreview = emoji && !showNoEmoji && !showNoEmoji;

  return (
    <>
      {showPreview && <EmojiPreview emoji={emoji} {...props} />}
      {showPickEmoji && <PickAnEmoji i18n={i18n} {...props} />}
      {showNoEmoji && <NoEmoji i18n={i18n} {...props} />}
    </>
  );
}

function EmojiPickerNavigation({
  emojiLibrary,
  focusedCategory,
  i18n,
  icons,
  onClick
}: {
  onClick: (id: EmojiCategoryList) => void;
} & Pick<UseEmojiPickerType, 'emojiLibrary' | 'focusedCategory' | 'i18n' | 'icons'>) {
  return (
    <TooltipProvider delayDuration={500}>
      <nav id="emoji-nav" className="border-b-border mb-2.5 border-0 border-b border-solid p-1.5">
        <div className="relative flex items-center justify-evenly">
          {emojiLibrary
            .getGrid()
            .sections()
            .map(({ id }) => (
              <Tooltip key={id} title={i18n.categories[id]}>
                <button
                  className={cn(
                    'text-muted-foreground hover:bg-muted hover:text-muted-foreground flex min-h-5 items-center justify-center rounded-full fill-current p-1.5',
                    id === focusedCategory &&
                      'bg-accent text-accent-foreground pointer-events-none fill-current'
                  )}
                  onClick={() => {
                    onClick(id);
                  }}
                  aria-label={i18n.categories[id]}
                  type="button">
                  <div className="inline-flex size-5 items-center justify-center text-lg">
                    {icons.categories[id].outline}
                  </div>
                </button>
              </Tooltip>
            ))}
        </div>
      </nav>
    </TooltipProvider>
  );
}

const emojiCategoryIcons: Record<
  EmojiCategoryList,
  {
    outline: React.ReactElement;
    solid: React.ReactElement; // Needed to add another solid variant - outline will be used for now
  }
> = {
  activity: {
    outline: <BallRugby />,
    solid: <BallRugby />
  },

  custom: {
    outline: <Star />,
    solid: <Star />
  },

  flags: {
    outline: <Flag />,
    solid: <Flag />
  },

  foods: {
    outline: <Apple />,
    solid: <Apple />
  },

  frequent: {
    outline: <Clock />,
    solid: <Clock />
  },

  nature: {
    outline: <Leaf />,
    solid: <Leaf />
  },

  objects: {
    outline: <Lightbulb />,
    solid: <Lightbulb />
  },

  people: {
    outline: <FaceGrin />,
    solid: <FaceGrin />
  },

  places: {
    outline: <Compass />,
    solid: <Compass />
  },

  symbols: {
    outline: <Music />,
    solid: <Music />
  }
};

const emojiSearchIcons = {
  delete: <Xmark />,
  loupe: <Magnifier />
};
