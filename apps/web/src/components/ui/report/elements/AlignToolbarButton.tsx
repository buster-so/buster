'use client';

import * as React from 'react';

import type { Alignment } from '@platejs/basic-styles';
import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { TextAlignPlugin } from '@platejs/basic-styles/react';
import {
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight
} from '@/components/ui/icons';
import { useEditorPlugin, useSelectionFragmentProp } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from './Toolbar';

const items = [
  {
    icon: TextAlignLeft,
    value: 'left'
  },
  {
    icon: TextAlignCenter,
    value: 'center'
  },
  {
    icon: TextAlignRight,
    value: 'right'
  },
  {
    icon: TextAlignJustify,
    value: 'justify'
  }
];

export function AlignToolbarButton(props: DropdownMenuProps) {
  const { editor, tf } = useEditorPlugin(TextAlignPlugin);
  const value =
    useSelectionFragmentProp({
      defaultValue: 'start',
      getProp: (node) => node.align
    }) ?? 'left';

  const [open, setOpen] = React.useState(false);
  const IconValue = items.find((item) => item.value === value)?.icon ?? TextAlignLeft;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Align" isDropdown>
          <IconValue />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-0" align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(value) => {
            tf.textAlign.setNodes(value as Alignment);
            editor.tf.focus();
          }}>
          {items.map(({ icon: Icon, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="data-[state=checked]:bg-accent pl-2 *:first:[span]:hidden"
              value={itemValue}>
              <Icon />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
