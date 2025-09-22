import { TrailingBlockPlugin } from 'platejs';

// import { AIKit } from './plugins/ai-kit';
import { AlignKit } from './plugins/align-kit';
import { AutoformatKit } from './plugins/autoformat-kit';
import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BasicMarksKit } from './plugins/basic-marks-kit';
import { BlockMenuKit } from './plugins/block-menu-kit';
import { BlockPlaceholderKit } from './plugins/block-placeholder-kit';
import { CalloutKit } from './plugins/callout-kit';
import { CaptionKit } from './plugins/caption-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { ColumnKit } from './plugins/column-kit';
import { CursorOverlayKit } from './plugins/cursor-overlay-kit';
import { DateKit } from './plugins/date-kit';
import { DndKit } from './plugins/dnd-kit';
import { DocxKit } from './plugins/docx-kit';
import { EmojiKit } from './plugins/emoji-kit';
import { ExitBreakKit } from './plugins/exit-break-kit';
import { FixedToolbarKit } from './plugins/fixed-toolbar-kit';
import { FloatingToolbarKit } from './plugins/floating-toolbar-kit';
import { FontKit } from './plugins/font-kit';
import { GlobalVariablePlugin } from './plugins/global-variable-kit';
import { LineHeightKit } from './plugins/line-height-kit';
import { LinkKit } from './plugins/link-kit';
import { ListKit } from './plugins/list-kit';
import { MarkdownKit } from './plugins/markdown-kit';
// import { MathKit } from './plugins/math-kit';
import { MediaKit } from './plugins/media-kit';
import { MetricKit } from './plugins/metric-kit';
import { SlashKit } from './plugins/slash-kit';
import { StreamContentKit } from './plugins/stream-content-kit';
import { TableKit } from './plugins/table-kit';
import { TocKit } from './plugins/toc-kit';
import { ToggleKit } from './plugins/toggle-kit';

export const EditorKit = ({
  scrollAreaRef,
  mode,
}: {
  scrollAreaRef?: React.RefObject<HTMLDivElement | null>;
  mode: 'default' | 'export';
}) => [
  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...EmojiKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...CalloutKit,
  ...ColumnKit,
  // ...MathKit,
  ...DateKit,
  ...LinkKit,
  ...CaptionKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // ...AIKit,
  ...BlockMenuKit,

  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // Custom
  ...StreamContentKit,
  ...MetricKit,

  // Parsers
  ...DocxKit,
  ...MarkdownKit,

  // UI
  ...BlockPlaceholderKit,
  ...FixedToolbarKit,
  ...FloatingToolbarKit,

  // Dnd
  ...DndKit({ scrollAreaRef }),

  //Global
  GlobalVariablePlugin.configure({
    options: { mode },
  }),
];
