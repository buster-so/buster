'use client';

import * as React from 'react';

// import { MessageSquareTextIcon } from 'lucide-react';
import { MessagePen } from '@/components/ui/icons';
import { useEditorRef } from 'platejs/react';
import { commentPlugin } from '../plugins/comment-kit';

import { ToolbarButton } from './Toolbar';

export function CommentToolbarButton() {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      onClick={() => {
        editor.getTransforms(commentPlugin).comment.setDraft();
      }}
      data-plate-prevent-overlay
      tooltip="Comment">
      <MessagePen />
    </ToolbarButton>
  );
}
