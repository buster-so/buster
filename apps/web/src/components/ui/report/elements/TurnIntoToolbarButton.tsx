'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import type { TElement } from 'platejs';

import { DropdownMenuItemIndicator } from '@radix-ui/react-dropdown-menu';
import {
  Check,
  ChevronRight,
  GridLayoutCols3,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  UnorderedList,
  OrderedList,
  Pilcrow,
  Quote,
  SquareCode
} from '@/components/ui/icons';
import { KEYS } from 'platejs';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { getBlockType, setBlockType } from './transforms';

import { ToolbarButton, ToolbarMenuGroup } from './Toolbar';

const turnIntoItems = [
  {
    icon: <Pilcrow />,
    keywords: ['paragraph'],
    label: 'Text',
    value: KEYS.p
  },
  {
    icon: <Heading1 />,
    keywords: ['title', 'h1'],
    label: 'Heading 1',
    value: 'h1'
  },
  {
    icon: <Heading2 />,
    keywords: ['subtitle', 'h2'],
    label: 'Heading 2',
    value: 'h2'
  },
  {
    icon: <Heading3 />,
    keywords: ['subtitle', 'h3'],
    label: 'Heading 3',
    value: 'h3'
  },
  {
    icon: <Heading4 />,
    keywords: ['subtitle', 'h4'],
    label: 'Heading 4',
    value: 'h4'
  },
  {
    icon: <Heading5 />,
    keywords: ['subtitle', 'h5'],
    label: 'Heading 5',
    value: 'h5'
  },
  {
    icon: <Heading6 />,
    keywords: ['subtitle', 'h6'],
    label: 'Heading 6',
    value: 'h6'
  },
  {
    icon: <UnorderedList />,
    keywords: ['unordered', 'ul', '-'],
    label: 'Bulleted list',
    value: KEYS.ul
  },
  {
    icon: <OrderedList />,
    keywords: ['ordered', 'ol', '1'],
    label: 'Numbered list',
    value: KEYS.ol
  },
  {
    icon: <SquareCode />,
    keywords: ['checklist', 'task', 'checkbox', '[]'],
    label: 'To-do list',
    value: KEYS.listTodo
  },
  {
    icon: <ChevronRight />,
    keywords: ['collapsible', 'expandable'],
    label: 'Toggle list',
    value: KEYS.toggle
  },
  {
    icon: <Code />,
    keywords: ['```'],
    label: 'Code',
    value: KEYS.codeBlock
  },
  {
    icon: <Quote />,
    keywords: ['citation', 'blockquote', '>'],
    label: 'Quote',
    value: KEYS.blockquote
  },
  {
    icon: <GridLayoutCols3 />,
    label: '3 columns',
    value: 'action_three_columns'
  }
];

export function TurnIntoToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement)
  });
  const selectedItem = React.useMemo(
    () => turnIntoItems.find((item) => item.value === (value ?? KEYS.p)) ?? turnIntoItems[0],
    [value]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton className="min-w-[125px]" pressed={open} tooltip="Turn into" isDropdown>
          {selectedItem.label}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar min-w-0"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
        align="start">
        <ToolbarMenuGroup
          value={value}
          onValueChange={(type) => {
            setBlockType(editor, type);
          }}
          label="Turn into">
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="min-w-[180px] pl-2 *:first:[span]:hidden"
              value={itemValue}>
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <Check />
                </DropdownMenuItemIndicator>
              </span>
              {icon}
              {label}
            </DropdownMenuRadioItem>
          ))}
        </ToolbarMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
