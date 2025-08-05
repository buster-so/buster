'use client';

import * as React from 'react';

import { NodeTypeIcons } from '../config/icons';
import { createLabel } from '../config/labels';
import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';

import { AIToolbarButton } from './AIToolbarButton';
import { CommentToolbarButton } from './CommandToolbarButton';
import { InlineEquationToolbarButton } from './EquationToolbarButton';
import { LinkToolbarButton } from './LinkToolbarButton';
import { MarkToolbarButton } from './MarktoolbarButton';
import { MoreToolbarButton } from './MoreToolbarButton';
import { SuggestionToolbarButton } from './SuggestionToolbarButton';
import { ToolbarGroup } from '@/components/ui/toolbar/Toolbar';
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

export const FixedToolbarButtons = React.memo(() => {
  const readOnly = useEditorReadOnly();

  return (
    <div className="flex w-full">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>

          {/* <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparkle />
            </AIToolbarButton>
          </ToolbarGroup> */}

          <ToolbarGroup>
            <ExportToolbarButton>
              <NodeTypeIcons.export />
            </ExportToolbarButton>

            <ImportToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <InsertToolbarButton />
            <TurnIntoToolbarButton />
            <FontSizeToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
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

            <FontColorToolbarButton nodeType={KEYS.color} tooltip={createLabel('textColor')}>
              <NodeTypeIcons.textColor />
            </FontColorToolbarButton>

            <FontColorToolbarButton
              nodeType={KEYS.backgroundColor}
              tooltip={createLabel('backgroundColor')}>
              <NodeTypeIcons.backgroundColor />
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

          {/* <ToolbarGroup>
            <MediaToolbarButton nodeType={KEYS.img} />
            <MediaToolbarButton nodeType={KEYS.video} />
            <MediaToolbarButton nodeType={KEYS.audio} />
            <MediaToolbarButton nodeType={KEYS.file} />
          </ToolbarGroup> */}

          <ToolbarGroup>
            <LineHeightToolbarButton />
            <OutdentToolbarButton />
            <IndentToolbarButton />
          </ToolbarGroup>

          {/* <ToolbarGroup>
            <MoreToolbarButton />
          </ToolbarGroup> */}
        </>
      )}

      <div className="grow" />

      {/* <ToolbarGroup> */}
      <MarkToolbarButton nodeType={KEYS.highlight} tooltip={createLabel('highlight')}>
        <NodeTypeIcons.highlight />
      </MarkToolbarButton>
      {/* <CommentToolbarButton /> */}
      {/* </ToolbarGroup> */}

      {/* <ToolbarGroup>
        <ModeToolbarButton />
      </ToolbarGroup> */}

      <div className="min-w-1" />
    </div>
  );
});

FixedToolbarButtons.displayName = 'FixedToolbarButtons';
