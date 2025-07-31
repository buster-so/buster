'use client';

import * as React from 'react';

import type { PlateEditor, PlateElementProps } from 'platejs/react';

import { AIChatPlugin } from '@platejs/ai/react';
// import {
//   CalendarIcon,
//   ChevronRightIcon,
//   Code2,
//   Columns3Icon,
//   Heading1Icon,
//   Heading2Icon,
//   Heading3Icon,
//   LightbulbIcon,
//   ListIcon,
//   ListOrdered,
//   PilcrowIcon,
//   Quote,
//   RadicalIcon,
//   SparklesIcon,
//   Square,
//   Table,
//   TableOfContentsIcon
// } from 'lucide-react';
import {
  Calendar,
  ChevronRight,
  Code2,
  TextColumns,
  Heading1,
  Heading2,
  Heading3,
  Lightbulb,
  OrderedList,
  BulletList,
  Pilcrow,
  Quote,
  Equation,
  Sparkle2,
  ShapeSquare,
  Table,
  SearchContent,
  ListTodo,
  GridLayoutCols3
} from '@/components/ui/icons';
import { type TComboboxInputElement, KEYS } from 'platejs';
import { PlateElement } from 'platejs/react';

import { insertBlock, insertInlineElement } from './transforms';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem
} from './InlineCombobox';

type Group = {
  group: string;
  items: Item[];
};

interface Item {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  className?: string;
  focusEditor?: boolean;
  keywords?: string[];
  label?: string;
}

const groups: Group[] = [
  {
    group: 'AI',
    items: [
      {
        focusEditor: false,
        icon: <Sparkle2 />,
        value: 'AI',
        onSelect: (editor) => {
          editor.getApi(AIChatPlugin).aiChat.show();
        }
      }
    ]
  },
  {
    group: 'Basic blocks',
    items: [
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
        value: KEYS.h1
      },
      {
        icon: <Heading2 />,
        keywords: ['subtitle', 'h2'],
        label: 'Heading 2',
        value: KEYS.h2
      },
      {
        icon: <Heading3 />,
        keywords: ['subtitle', 'h3'],
        label: 'Heading 3',
        value: KEYS.h3
      },
      {
        icon: <BulletList />,
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
        icon: <ListTodo />,
        keywords: ['checklist', 'task', 'checkbox', '[]'],
        label: 'To-do list',
        value: KEYS.listTodo
      },
      {
        icon: <ChevronRight />,
        keywords: ['collapsible', 'expandable'],
        label: 'Toggle',
        value: KEYS.toggle
      },
      {
        icon: <Code2 />,
        keywords: ['```'],
        label: 'Code Block',
        value: KEYS.codeBlock
      },
      {
        icon: <Table />,
        label: 'Table',
        value: KEYS.table
      },
      {
        icon: <Quote />,
        keywords: ['citation', 'blockquote', 'quote', '>'],
        label: 'Blockquote',
        value: KEYS.blockquote
      },
      {
        description: 'Insert a highlighted block.',
        icon: <Lightbulb />,
        keywords: ['note'],
        label: 'Callout',
        value: KEYS.callout
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
        icon: <SearchContent />,
        keywords: ['toc'],
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
        focusEditor: true,
        icon: <Calendar />,
        keywords: ['time'],
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

export function SlashInputElement(props: PlateElementProps<TComboboxInputElement>) {
  const { editor, element } = props;

  return (
    <PlateElement {...props} as="span" data-slate-value={element.value}>
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(({ focusEditor, icon, keywords, label, value, onSelect }) => (
                <InlineComboboxItem
                  key={value}
                  value={value}
                  onClick={() => onSelect(editor, value)}
                  label={label}
                  focusEditor={focusEditor}
                  group={group}
                  keywords={keywords}>
                  <div className="text-muted-foreground mr-2">{icon}</div>
                  {label ?? value}
                </InlineComboboxItem>
              ))}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
