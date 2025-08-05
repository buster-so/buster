'use client';

import * as React from 'react';

import { useLinkToolbarButton, useLinkToolbarButtonState } from '@platejs/link/react';
import { NodeTypeIcons } from '../config/icons';
import { createLabel } from '../config/labels';

import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';

export function LinkToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const state = useLinkToolbarButtonState();
  const { props: buttonProps } = useLinkToolbarButton(state);

  return (
    <ToolbarButton {...props} {...buttonProps} data-plate-focus tooltip={createLabel('link')}>
      <NodeTypeIcons.linkIcon />
    </ToolbarButton>
  );
}
