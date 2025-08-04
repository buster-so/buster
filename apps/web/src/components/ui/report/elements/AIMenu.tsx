'use client';

import * as React from 'react';

import { AIChatPlugin, AIPlugin, useEditorChat, useLastAssistantMessage } from '@platejs/ai/react';
import { BlockSelectionPlugin, useIsSelecting } from '@platejs/selection/react';
import { Command as CommandPrimitive } from 'cmdk';
import {
  Album,
  CircleQuestion,
  ClipboardCheck,
  Check2,
  ArrowUpLeft,
  Feather,
  Underwear,
  ObjRemove,
  AddBelow,
  Loader,
  MediaPause,
  Pen2,
  FaceGrin2,
  WandSparkle,
  Xmark,
  BookOpen,
  Plus,
  Minus
} from '@/components/ui/icons';
import { type SlateEditor, isHotkey, NodeApi } from 'platejs';
import { useEditorPlugin, useHotkeys, usePluginOption } from 'platejs/react';
import { type PlateEditor, useEditorRef } from 'platejs/react';

import { Button } from '@/components/ui/buttons';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { PopoverBase, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { AIChatEditor } from './AIChatEditor';

export function AIMenu() {
  const { api, editor } = useEditorPlugin(AIChatPlugin);
  const open = usePluginOption(AIChatPlugin, 'open');
  const mode = usePluginOption(AIChatPlugin, 'mode');
  const streaming = usePluginOption(AIChatPlugin, 'streaming');
  const isSelecting = useIsSelecting();

  const [value, setValue] = React.useState('');

  const chat = {
    input: '',
    messages: [],
    setInput: () => {},
    status: 'idle'
  };

  const { input, messages, setInput, status } = chat;
  const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);

  const content = useLastAssistantMessage()?.content;

  React.useEffect(() => {
    if (streaming) {
      const anchor = api.aiChat.node({ anchor: true });
      setTimeout(() => {
        const anchorDom = editor.api.toDOMNode(anchor![0])!;
        setAnchorElement(anchorDom);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);

  const setOpen = (open: boolean) => {
    if (open) {
      api.aiChat.show();
    } else {
      api.aiChat.hide();
    }
  };

  const show = (anchorElement: HTMLElement) => {
    setAnchorElement(anchorElement);
    setOpen(true);
  };

  //   useEditorChat({
  //     chat,
  //     onOpenBlockSelection: (blocks: NodeEntry[]) => {
  //       show(editor.api.toDOMNode(blocks.at(-1)![0])!);
  //     },
  //     onOpenChange: (open) => {
  //       if (!open) {
  //         setAnchorElement(null);
  //         setInput('');
  //       }
  //     },
  //     onOpenCursor: () => {
  //       const [ancestor] = editor.api.block({ highest: true })!;

  //       if (!editor.api.isAt({ end: true }) && !editor.api.isEmpty(ancestor)) {
  //         editor.getApi(BlockSelectionPlugin).blockSelection.set(ancestor.id as string);
  //       }

  //       show(editor.api.toDOMNode(ancestor)!);
  //     },
  //     onOpenSelection: () => {
  //       show(editor.api.toDOMNode(editor.api.blocks().at(-1)![0])!);
  //     }
  //   });

  //   useHotkeys('esc', () => {
  //     api.aiChat.stop();

  //     // remove when you implement the route /api/ai/command
  //     chat._abortFakeStream();
  //   });

  const isLoading = status === 'streaming' || status === 'submitted';

  if (isLoading && mode === 'insert') {
    return null;
  }

  return (
    <PopoverBase open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor virtualRef={{ current: anchorElement! }} />

      <PopoverContent
        className="border-none bg-transparent p-0 shadow-none"
        style={{
          width: anchorElement?.offsetWidth
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();

          api.aiChat.hide();
        }}
        align="center"
        side="bottom">
        <Command
          className="w-full rounded-lg border shadow-md"
          value={value}
          onValueChange={setValue}>
          {mode === 'chat' && isSelecting && content && <AIChatEditor content={content} />}

          {isLoading ? (
            <div className="text-muted-foreground flex grow items-center gap-2 p-2 text-sm select-none">
              <div className="size-4 animate-spin">
                <Loader />
              </div>
              {messages.length > 1 ? 'Editing...' : 'Thinking...'}
            </div>
          ) : (
            <CommandPrimitive.Input
              className={cn(
                'border-input placeholder:text-muted-foreground dark:bg-input/30 flex h-9 w-full min-w-0 bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none md:text-sm',
                'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                'border-b focus-visible:ring-transparent'
              )}
              value={input}
              onKeyDown={(e) => {
                if (isHotkey('backspace')(e) && input.length === 0) {
                  e.preventDefault();
                  api.aiChat.hide();
                }
                if (isHotkey('enter')(e) && !e.shiftKey && !value) {
                  e.preventDefault();
                  void api.aiChat.submit();
                }
              }}
              onValueChange={setInput}
              placeholder="Ask AI anything..."
              data-plate-focus
              autoFocus
            />
          )}

          {!isLoading && (
            <CommandList>
              <AIMenuItems setValue={setValue} />
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </PopoverBase>
  );
}

type EditorChatState =
  | 'cursorCommand'
  | 'cursorSuggestion'
  | 'selectionCommand'
  | 'selectionSuggestion';

const aiChatItems = {
  accept: {
    icon: <Check2 />,
    label: 'Accept',
    value: 'accept',
    onSelect: ({ editor }) => {
      editor.getTransforms(AIChatPlugin).aiChat.accept();
      editor.tf.focus({ edge: 'end' });
    }
  },
  continueWrite: {
    icon: <Pen2 />,
    label: 'Continue writing',
    value: 'continueWrite',
    onSelect: ({ editor }) => {
      const ancestorNode = editor.api.block({ highest: true });

      if (!ancestorNode) return;

      const isEmpty = NodeApi.string(ancestorNode[0]).trim().length === 0;

      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: isEmpty
          ? `<Document>
{editor}
</Document>
Start writing a new paragraph AFTER <Document> ONLY ONE SENTENCE`
          : 'Continue writing AFTER <Block> ONLY ONE SENTENCE. DONT REPEAT THE TEXT.'
      });
    }
  },
  discard: {
    icon: <Xmark />,
    label: 'Discard',
    shortcut: 'Escape',
    value: 'discard',
    onSelect: ({ editor }) => {
      editor.getTransforms(AIPlugin).ai.undo();
      editor.getApi(AIChatPlugin).aiChat.hide();
    }
  },
  emojify: {
    icon: <FaceGrin2 />,
    label: 'Emojify',
    value: 'emojify',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        prompt: 'Emojify'
      });
    }
  },
  explain: {
    icon: <CircleQuestion />,
    label: 'Explain',
    value: 'explain',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        prompt: {
          default: 'Explain {editor}',
          selecting: 'Explain'
        }
      });
    }
  },
  fixSpelling: {
    icon: <Check2 />,
    label: 'Fix spelling & grammar',
    value: 'fixSpelling',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        prompt: 'Fix spelling and grammar'
      });
    }
  },
  generateMarkdownSample: {
    icon: <BookOpen />,
    label: 'Generate Markdown sample',
    value: 'generateMarkdownSample',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        prompt: 'Generate a markdown sample'
      });
    }
  },
  generateMdxSample: {
    icon: <BookOpen />,
    label: 'Generate MDX sample',
    value: 'generateMdxSample',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        prompt: 'Generate a mdx sample'
      });
    }
  },
  improveWriting: {
    icon: <WandSparkle />,
    label: 'Improve writing',
    value: 'improveWriting',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        prompt: 'Improve the writing'
      });
    }
  },
  insertBelow: {
    icon: <AddBelow />,
    label: 'Insert below',
    value: 'insertBelow',
    onSelect: ({ aiEditor, editor }) => {
      void editor.getTransforms(AIChatPlugin).aiChat.insertBelow(aiEditor);
    }
  },
  makeLonger: {
    icon: <Plus />,
    label: 'Make longer',
    value: 'makeLonger',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        prompt: 'Make longer'
      });
    }
  },
  makeShorter: {
    icon: <Minus />,
    label: 'Make shorter',
    value: 'makeShorter',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        prompt: 'Make shorter'
      });
    }
  },
  replace: {
    icon: <Check2 />,
    label: 'Replace selection',
    value: 'replace',
    onSelect: ({ aiEditor, editor }) => {
      void editor.getTransforms(AIChatPlugin).aiChat.replaceSelection(aiEditor);
    }
  },
  simplifyLanguage: {
    icon: <Feather />,
    label: 'Simplify language',
    value: 'simplifyLanguage',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        prompt: 'Simplify the language'
      });
    }
  },
  summarize: {
    icon: <Album />,
    label: 'Add a summary',
    value: 'summarize',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: {
          default: 'Summarize {editor}',
          selecting: 'Summarize'
        }
      });
    }
  },
  tryAgain: {
    icon: <ArrowUpLeft />,
    label: 'Try again',
    value: 'tryAgain',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.reload();
    }
  }
} satisfies Record<
  string,
  {
    icon: React.ReactNode;
    label: string;
    value: string;
    component?: React.ComponentType<{ menuState: EditorChatState }>;
    filterItems?: boolean;
    items?: { label: string; value: string }[];
    shortcut?: string;
    onSelect?: ({ aiEditor, editor }: { aiEditor: SlateEditor; editor: PlateEditor }) => void;
  }
>;

const menuStateItems: Record<
  EditorChatState,
  {
    items: (typeof aiChatItems)[keyof typeof aiChatItems][];
    heading?: string;
  }[]
> = {
  cursorCommand: [
    {
      items: [
        aiChatItems.generateMdxSample,
        aiChatItems.generateMarkdownSample,
        aiChatItems.continueWrite,
        aiChatItems.summarize,
        aiChatItems.explain
      ]
    }
  ],
  cursorSuggestion: [
    {
      items: [aiChatItems.accept, aiChatItems.discard, aiChatItems.tryAgain]
    }
  ],
  selectionCommand: [
    {
      items: [
        aiChatItems.improveWriting,
        aiChatItems.emojify,
        aiChatItems.makeLonger,
        aiChatItems.makeShorter,
        aiChatItems.fixSpelling,
        aiChatItems.simplifyLanguage
      ]
    }
  ],
  selectionSuggestion: [
    {
      items: [
        aiChatItems.replace,
        aiChatItems.insertBelow,
        aiChatItems.discard,
        aiChatItems.tryAgain
      ]
    }
  ]
};

export const AIMenuItems = ({ setValue }: { setValue: (value: string) => void }) => {
  const editor = useEditorRef();
  const { messages } = usePluginOption(AIChatPlugin, 'chat');
  const aiEditor = usePluginOption(AIChatPlugin, 'aiEditor')!;
  const isSelecting = useIsSelecting();

  const menuState = React.useMemo(() => {
    if (messages && messages.length > 0) {
      return isSelecting ? 'selectionSuggestion' : 'cursorSuggestion';
    }

    return isSelecting ? 'selectionCommand' : 'cursorCommand';
  }, [isSelecting, messages]);

  const menuGroups = React.useMemo(() => {
    const items = menuStateItems[menuState];

    return items;
  }, [menuState]);

  React.useEffect(() => {
    if (menuGroups.length > 0 && menuGroups[0].items.length > 0) {
      setValue(menuGroups[0].items[0].value);
    }
  }, [menuGroups, setValue]);

  return (
    <>
      {menuGroups.map((group, index) => (
        <CommandGroup key={index} heading={group.heading}>
          {group.items.map((menuItem) => (
            <CommandItem
              key={menuItem.value}
              className="[&_svg]:text-muted-foreground"
              value={menuItem.value}
              onSelect={() => {
                menuItem.onSelect?.({
                  aiEditor,
                  editor: editor
                });
              }}>
              {menuItem.icon}
              <span>{menuItem.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
    </>
  );
};

export function AILoadingBar() {
  const chat = usePluginOption(AIChatPlugin, 'chat');
  const mode = usePluginOption(AIChatPlugin, 'mode');

  const { status } = chat;

  const { api } = useEditorPlugin(AIChatPlugin);

  const isLoading = status === 'streaming' || status === 'submitted';

  const visible = isLoading && mode === 'insert';

  if (!visible) return null;

  return (
    <div
      className={cn(
        'border-border bg-muted text-muted-foreground absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-md border px-3 py-1.5 text-sm shadow-md transition-all duration-300'
      )}>
      <span className="border-muted-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
      <span>{status === 'submitted' ? 'Thinking...' : 'Writing...'}</span>
      <Button
        size="small"
        variant="ghost"
        className="flex items-center gap-1 text-xs"
        onClick={() => api.aiChat.stop()}
        prefix={<MediaPause />}>
        Stop
        <kbd className="bg-border text-muted-foreground ml-1 rounded px-1 font-mono text-[10px] shadow-sm">
          Esc
        </kbd>
      </Button>
    </div>
  );
}
