'use client';

import * as React from 'react';
import { NodeTypeIcons } from '../config/icons';
import { createLabel } from '../config/labels';
import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';

import { AIToolbarButton } from './AIToolbarButton';
import { CommentToolbarButton } from './CommandToolbarButton';
// import { InlineEquationToolbarButton } from './EquationToolbarButton';
import { LinkToolbarButton } from './LinkToolbarButton';
import { MarkToolbarButton } from './MarktoolbarButton';
// import { MoreToolbarButton } from './MoreToolbarButton';
import { SuggestionToolbarButton } from './SuggestionToolbarButton';
import { ToolbarGroup } from '@/components/ui/toolbar/Toolbar';
import { TurnIntoToolbarButton } from './TurnIntoToolbarButton';

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <>
      {!readOnly && (
        <>
          {/* <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              {AIIcon}
              Ask AI
            </AIToolbarButton>
          </ToolbarGroup> */}

          <ToolbarGroup>
            <TurnIntoToolbarButton />

            <MarkToolbarButton nodeType={KEYS.bold} tooltip={createLabel('bold')}>
              <NodeTypeIcons.bold />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip={createLabel('italic')}>
              <NodeTypeIcons.italic />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.underline} tooltip={createLabel('underline')}>
              <NodeTypeIcons.underline />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip={createLabel('strikethrough')}>
              <NodeTypeIcons.strikethrough />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip={createLabel('code')}>
              <NodeTypeIcons.code />
            </MarkToolbarButton>

            {/* <InlineEquationToolbarButton /> */}

            <LinkToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <ToolbarGroup>
        {/* <CommentToolbarButton />
        <SuggestionToolbarButton /> */}

        {/* {!readOnly && <MoreToolbarButton />} */}
      </ToolbarGroup>
    </>
  );
}
