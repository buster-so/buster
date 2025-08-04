'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import type { TElement } from 'platejs';

import { DropdownMenuItemIndicator } from '@radix-ui/react-dropdown-menu';
import { Check } from '@/components/ui/icons';
import { NodeTypeIcons } from '../config/icons';
import { createLabel, NodeTypeLabels, createMenuItem } from '../config/labels';
import { KEYS } from 'platejs';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { getBlockType, setBlockType } from './transforms';

import { ToolbarButton, ToolbarMenuGroup } from '@/components/ui/toolbar/Toolbar';

const turnIntoItems = [
  createMenuItem('paragraph', KEYS.p, <NodeTypeIcons.paragraph />),
  createMenuItem('h1', 'h1', <NodeTypeIcons.h1 />),
  createMenuItem('h2', 'h2', <NodeTypeIcons.h2 />),
  createMenuItem('h3', 'h3', <NodeTypeIcons.h3 />),
  createMenuItem('h4', 'h4', <NodeTypeIcons.h4 />),
  createMenuItem('h5', 'h5', <NodeTypeIcons.h5 />),
  createMenuItem('h6', 'h6', <NodeTypeIcons.h6 />),
  createMenuItem('bulletedList', KEYS.ul, <NodeTypeIcons.bulletedList />),
  createMenuItem('numberedList', KEYS.ol, <NodeTypeIcons.numberedList />),
  createMenuItem('todoList', KEYS.listTodo, <NodeTypeIcons.checkList />),
  createMenuItem('toggleList', KEYS.toggle, <NodeTypeIcons.toggle />),
  createMenuItem('codeBlock', KEYS.codeBlock, <NodeTypeIcons.codeBlock />),
  createMenuItem('blockquote', KEYS.blockquote, <NodeTypeIcons.quote />),
  createMenuItem('columnsThree', 'action_three_columns', <NodeTypeIcons.columnsThree />)
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
      <DropdownMenuTrigger>
        <ToolbarButton
          className="min-w-[125px]"
          pressed={open}
          tooltip={createLabel('turnInto')}
          isDropdown>
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
          label={NodeTypeLabels.turnInto.label}>
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
