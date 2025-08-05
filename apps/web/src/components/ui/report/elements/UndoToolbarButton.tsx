'use client';

import * as React from 'react';

import { useEditorRef, useEditorSelector } from 'platejs/react';
import { NodeTypeIcons } from '../config/icons';
import { createLabel } from '../config/labels';

import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';

export function RedoToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const editor = useEditorRef();
  const disabled = useEditorSelector((editor) => editor.history.redos.length === 0, []);

  return (
    <ToolbarButton
      {...props}
      disabled={disabled}
      onClick={() => editor.redo()}
      onMouseDown={(e) => e.preventDefault()}
      tooltip={createLabel('redo')}>
      <NodeTypeIcons.redo />
    </ToolbarButton>
  );
}

export function UndoToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const editor = useEditorRef();
  const disabled = useEditorSelector((editor) => editor.history.undos.length === 0, []);

  return (
    <ToolbarButton
      {...props}
      disabled={disabled}
      onClick={() => editor.undo()}
      onMouseDown={(e) => e.preventDefault()}
      tooltip={createLabel('undo')}>
      <NodeTypeIcons.undo />
    </ToolbarButton>
  );
}
