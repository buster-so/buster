'use client';

import { createLabel } from '../config/labels';

import * as React from 'react';

import { MessagePen } from '@/components/ui/icons';
import { useEditorRef } from 'platejs/react';
import { commentPlugin } from '../plugins/comment-kit';

import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';

export function CommentToolbarButton() {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      onClick={() => {
        editor.getTransforms(commentPlugin).comment.setDraft();
      }}
      data-plate-prevent-overlay
      tooltip={createLabel('comment')}>
      <MessagePen />
    </ToolbarButton>
  );
}
