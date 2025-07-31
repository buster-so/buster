'use client';

import * as React from 'react';

// import {
//   BoldIcon,
//   Code2Icon,
//   ItalicIcon,
//   StrikethroughIcon,
//   UnderlineIcon,
//   WandSparklesIcon
// } from 'lucide-react';
import {
  TextBold,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
  WandSparkle,
  Code2
} from '@/components/ui/icons';
import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';

import { AIToolbarButton } from './AIToolbarButton';
import { CommentToolbarButton } from './CommandToolbarButton';
import { InlineEquationToolbarButton } from './EquationToolbarButton';
import { LinkToolbarButton } from './LinkToolbarButton';
import { MarkToolbarButton } from './MarktoolbarButton';
import { MoreToolbarButton } from './MoreToolbarButton';
import { SuggestionToolbarButton } from './SuggestionToolbarButton';
import { ToolbarGroup } from './Toolbar';
import { TurnIntoToolbarButton } from './TurnIntoToolbarButton';

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <>
      {!readOnly && (
        <>
          <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparkle />
              Ask AI
            </AIToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <TurnIntoToolbarButton />

            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
              <TextBold />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
              <TextItalic />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.underline} tooltip="Underline (⌘+U)">
              <TextUnderline />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip="Strikethrough (⌘+⇧+M)">
              <TextStrikethrough />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
              <Code2 />
            </MarkToolbarButton>

            <InlineEquationToolbarButton />

            <LinkToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <ToolbarGroup>
        <CommentToolbarButton />
        <SuggestionToolbarButton />

        {!readOnly && <MoreToolbarButton />}
      </ToolbarGroup>
    </>
  );
}
