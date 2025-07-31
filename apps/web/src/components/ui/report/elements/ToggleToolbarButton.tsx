'use client';

import * as React from 'react';

import { useToggleToolbarButton, useToggleToolbarButtonState } from '@platejs/toggle/react';
import { DescendingSorting } from '@/components/ui/icons';

import { ToolbarButton } from './Toolbar';

export function ToggleToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const state = useToggleToolbarButtonState();
  const { props: buttonProps } = useToggleToolbarButton(state);

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip="Toggle">
      <DescendingSorting />
    </ToolbarButton>
  );
}
