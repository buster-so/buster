'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import {
  Calendar,
  ChevronRight,
  GridLayoutCols3,
  FileCloud,
  Film,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link2,
  UnorderedList,
  OrderedList,
  Minus,
  Pilcrow,
  Plus,
  Quote,
  Equation,
  ShapeSquare,
  Table,
  Book2,
  Code2
} from '@/components/ui/icons';
import { KEYS } from 'platejs';
import { type PlateEditor, useEditorRef } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { insertBlock, insertInlineElement } from './transforms';

import { ToolbarButton, ToolbarMenuGroup } from './Toolbar';

type Group = {
  group: string;
  items: Item[];
};

interface Item {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  focusEditor?: boolean;
  label?: string;
}

const groups: Group[] = [
  {
    group: 'Basic blocks',
    items: [
      {
        icon: <Pilcrow />,
        label: 'Paragraph',
        value: KEYS.p
      },
      {
        icon: <Heading1 />,
        label: 'Heading 1',
        value: 'h1'
      },
      {
        icon: <Heading2 />,
        label: 'Heading 2',
        value: 'h2'
      },
      {
        icon: <Heading3 />,
        label: 'Heading 3',
        value: 'h3'
      },
      {
        icon: <Table />,
        label: 'Table',
        value: KEYS.table
      },
      {
        icon: <Code2 />,
        label: 'Code',
        value: KEYS.codeBlock
      },
      {
        icon: <Quote />,
        label: 'Quote',
        value: KEYS.blockquote
      },
      {
        icon: <Minus />,
        label: 'Divider',
        value: KEYS.hr
      }
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      }
    }))
  },
  {
    group: 'Lists',
    items: [
      {
        icon: <UnorderedList />,
        label: 'Bulleted list',
        value: KEYS.ul
      },
      {
        icon: <OrderedList />,
        label: 'Numbered list',
        value: KEYS.ol
      },
      {
        icon: <ShapeSquare />,
        label: 'To-do list',
        value: KEYS.listTodo
      },
      {
        icon: <ChevronRight />,
        label: 'Toggle list',
        value: KEYS.toggle
      }
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      }
    }))
  },
  {
    group: 'Media',
    items: [
      {
        icon: <ImageIcon />,
        label: 'Image',
        value: KEYS.img
      },
      {
        icon: <Film />,
        label: 'Embed',
        value: KEYS.mediaEmbed
      }
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      }
    }))
  },
  {
    group: 'Advanced blocks',
    items: [
      {
        icon: <Book2 />,
        label: 'Table of contents',
        value: KEYS.toc
      },
      {
        icon: <GridLayoutCols3 />,
        label: '3 columns',
        value: 'action_three_columns'
      },
      {
        focusEditor: false,
        icon: <Equation />,
        label: 'Equation',
        value: KEYS.equation
      }
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      }
    }))
  },
  {
    group: 'Inline',
    items: [
      {
        icon: <Link2 />,
        label: 'Link',
        value: KEYS.link
      },
      {
        focusEditor: true,
        icon: <Calendar />,
        label: 'Date',
        value: KEYS.date
      },
      {
        focusEditor: false,
        icon: <Equation />,
        label: 'Inline Equation',
        value: KEYS.inlineEquation
      }
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value);
      }
    }))
  }
];

export function InsertToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Insert" isDropdown>
          <Plus />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="flex max-h-[500px] min-w-0 flex-col overflow-y-auto"
        align="start">
        {groups.map(({ group, items: nestedItems }) => (
          <ToolbarMenuGroup key={group} label={group}>
            {nestedItems.map(({ icon, label, value, onSelect }) => (
              <DropdownMenuItem
                key={value}
                className="min-w-[180px]"
                onSelect={() => {
                  onSelect(editor, value);
                  editor.tf.focus();
                }}>
                {icon}
                {label}
              </DropdownMenuItem>
            ))}
          </ToolbarMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
