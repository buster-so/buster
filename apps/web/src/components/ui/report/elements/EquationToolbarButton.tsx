'use client';

import * as React from 'react';

import { insertInlineEquation } from '@platejs/math';
import { Equation } from '@/components/ui/icons';
import { useEditorRef } from 'platejs/react';

import { ToolbarButton } from './Toolbar';

export function InlineEquationToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        insertInlineEquation(editor);
      }}
      tooltip="Mark as equation">
      <Equation />
    </ToolbarButton>
  );
}
