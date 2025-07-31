'use client';

import * as React from 'react';

import {
  TextBold,
  Code2,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
  WandSparkle,
  ArrowUpToLine,
  TextColor2,
  BucketPaint,
  TextHighlight2
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
import { UndoToolbarButton, RedoToolbarButton } from './UndoToolbarButton';
import { ExportToolbarButton } from './ExportToolbarButton';
import { ImportToolbarButton } from './ImportToolbarButton';
import { InsertToolbarButton } from './InsertToolbarButton';
import { FontSizeToolbarButton } from './FontSizeToolbarButton';
import { FontColorToolbarButton } from './FontColorToolbarButton';
import { AlignToolbarButton } from './AlignToolbarButton';
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton
} from './ListToolbarButton';
import { ToggleToolbarButton } from './ToggleToolbarButton';
import { TableToolbarButton } from './TableToolbarButton';
import { EmojiToolbarButton } from './EmojiToolbarButton';
import { MediaToolbarButton } from './MediaToolbarButton';
import { LineHeightToolbarButton } from './LineHeightToolbarButton';
import { IndentToolbarButton, OutdentToolbarButton } from './IndentToolbarButton';
import { ModeToolbarButton } from './ModeToolbarButton';

export function FixedToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <div className="flex w-full">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparkle />
            </AIToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <ExportToolbarButton>
              <ArrowUpToLine />
            </ExportToolbarButton>

            <ImportToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <InsertToolbarButton />
            <TurnIntoToolbarButton />
            <FontSizeToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
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

            <FontColorToolbarButton nodeType={KEYS.color} tooltip="Text color">
              <TextColor2 />
            </FontColorToolbarButton>

            <FontColorToolbarButton nodeType={KEYS.backgroundColor} tooltip="Background color">
              <BucketPaint />
            </FontColorToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <AlignToolbarButton />

            <NumberedListToolbarButton />
            <BulletedListToolbarButton />
            <TodoListToolbarButton />
            <ToggleToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LinkToolbarButton />
            <TableToolbarButton />
            <EmojiToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MediaToolbarButton nodeType={KEYS.img} />
            <MediaToolbarButton nodeType={KEYS.video} />
            <MediaToolbarButton nodeType={KEYS.audio} />
            <MediaToolbarButton nodeType={KEYS.file} />
          </ToolbarGroup>

          <ToolbarGroup>
            <LineHeightToolbarButton />
            <OutdentToolbarButton />
            <IndentToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MoreToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <div className="grow" />

      <ToolbarGroup>
        <MarkToolbarButton nodeType={KEYS.highlight} tooltip="Highlight">
          <TextHighlight2 />
        </MarkToolbarButton>
        <CommentToolbarButton />
      </ToolbarGroup>

      <ToolbarGroup>
        <ModeToolbarButton />
      </ToolbarGroup>
    </div>
  );
}
