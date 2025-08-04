'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { LineHeightPlugin } from '@platejs/basic-styles/react';
import { DropdownMenuItemIndicator } from '@radix-ui/react-dropdown-menu';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';
import { NodeTypeIcons } from '../config/icons';
import { createLabel } from '../config/labels';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';

export function LineHeightToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const { defaultNodeValue, validNodeValues: values = [] } =
    editor.getInjectProps(LineHeightPlugin);

  const value = useSelectionFragmentProp({
    defaultValue: defaultNodeValue,
    getProp: (node) => node.lineHeight
  });

  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger>
        <ToolbarButton pressed={open} tooltip={createLabel('lineHeight')} isDropdown>
          <div className="size-4">
            <NodeTypeIcons.lineHeight />
          </div>
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-0" align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(newValue) => {
            editor.getTransforms(LineHeightPlugin).lineHeight.setNodes(Number(newValue));
            editor.tf.focus();
          }}>
          {values.map((value) => (
            <DropdownMenuRadioItem
              key={value}
              className="min-w-[180px] pl-2 *:first:[span]:hidden"
              value={value}>
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <NodeTypeIcons.check />
                </DropdownMenuItemIndicator>
              </span>
              {value}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
