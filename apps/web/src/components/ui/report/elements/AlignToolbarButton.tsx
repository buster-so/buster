'use client';

import * as React from 'react';

import type { Alignment } from '@platejs/basic-styles';
import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { useEditorPlugin, useSelectionFragmentProp } from 'platejs/react';
import { NodeTypeIcons } from '../config/icons';
import { createLabel, NodeTypeLabels } from '../config/labels';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';
import { Tooltip } from '../../tooltip';

const items = [
  {
    icon: NodeTypeIcons.alignLeft,
    label: NodeTypeLabels.alignLeft.label,
    value: 'left'
  },
  {
    icon: NodeTypeIcons.alignCenter,
    label: NodeTypeLabels.alignCenter.label,
    value: 'center'
  },
  {
    icon: NodeTypeIcons.alignRight,
    label: NodeTypeLabels.alignRight.label,
    value: 'right'
  },
  {
    icon: NodeTypeIcons.alignJustify,
    label: NodeTypeLabels.alignJustify.label,
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
  const IconValue = items.find((item) => item.value === value)?.icon ?? NodeTypeIcons.alignLeft;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger>
        <ToolbarButton pressed={open} tooltip={createLabel('align')} isDropdown>
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
          {items.map(({ icon: Icon, label, value: itemValue }) => (
            <Tooltip key={itemValue} title={label} side="left">
              <DropdownMenuRadioItem
                key={itemValue}
                className="data-[state=checked]:bg-accent pl-2 *:first:[span]:hidden"
                value={itemValue}>
                <Icon />
              </DropdownMenuRadioItem>
            </Tooltip>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
