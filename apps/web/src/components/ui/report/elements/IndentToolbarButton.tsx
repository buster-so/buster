'use client';

import * as React from 'react';

import { useIndentButton, useOutdentButton } from '@platejs/indent/react';
import { NodeTypeIcons } from '../config/icons';
import { createLabel } from '../config/labels';

import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';

export function IndentToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const { props: buttonProps } = useIndentButton();

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={createLabel('indent')}>
      <NodeTypeIcons.indent />
    </ToolbarButton>
  );
}

export function OutdentToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const { props: buttonProps } = useOutdentButton();

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={createLabel('outdent')}>
      <NodeTypeIcons.outdent />
    </ToolbarButton>
  );
}
