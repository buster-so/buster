'use client';

import * as React from 'react';

import { SuggestionPlugin } from '@platejs/suggestion/react';
import { Pencil2 } from '@/components/ui/icons';
import { useEditorPlugin, usePluginOption } from 'platejs/react';

import { cn } from '@/lib/utils';

import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';

export function SuggestionToolbarButton() {
  const { setOption } = useEditorPlugin(SuggestionPlugin);
  const isSuggesting = usePluginOption(SuggestionPlugin, 'isSuggesting');

  return (
    <ToolbarButton
      className={cn(isSuggesting && 'text-brand/80 hover:text-brand/80')}
      onClick={() => setOption('isSuggesting', !isSuggesting)}
      onMouseDown={(e) => e.preventDefault()}
      tooltip={isSuggesting ? 'Turn off suggesting' : 'Suggestion edits'}>
      <Pencil2 />
    </ToolbarButton>
  );
}
