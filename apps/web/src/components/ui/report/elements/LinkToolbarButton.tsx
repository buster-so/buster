'use client';

import * as React from 'react';

import { useLinkToolbarButton, useLinkToolbarButtonState } from '@platejs/link/react';
import { Link } from '@/components/ui/icons';

import { ToolbarButton } from './Toolbar';

export function LinkToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const state = useLinkToolbarButtonState();
  const { props: buttonProps } = useLinkToolbarButton(state);

  return (
    <ToolbarButton {...props} {...buttonProps} data-plate-focus tooltip="Link">
      <Link />
    </ToolbarButton>
  );
}
