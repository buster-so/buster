'use client';

import { TrailingBlockPlugin } from 'platejs';
import { AlignKit } from './plugins/align-kit';
import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BasicMarksKit } from './plugins/basic-marks-kit';
import { ExitBreakKit } from './plugins/exit-break-kit';
import { FixedToolbarKit } from './plugins/fixed-toolbar-kit';
import { LineHeightKit } from './plugins/line-height-kit';
import { LinkKit } from './plugins/link-kit';
import { ListKit } from './plugins/list-kit';

export const BaseEditorKit = [
  ...BasicBlocksKit,
  ...BasicMarksKit,
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,
  ...LinkKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,
  ...FixedToolbarKit
];
