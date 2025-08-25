import { AutoformatPlugin } from '@platejs/autoformat';
import {
  BaseBasicBlocksPlugin,
  BaseBasicMarksPlugin,
  BaseBlockquotePlugin,
  BaseBoldPlugin,
  BaseCodePlugin,
  BaseH1Plugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseH4Plugin,
  BaseH5Plugin,
  BaseH6Plugin,
  BaseHeadingPlugin,
  BaseHighlightPlugin,
  BaseHorizontalRulePlugin,
  BaseItalicPlugin,
  BaseKbdPlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseUnderlinePlugin
} from '@platejs/basic-nodes';
import {
  BaseFontBackgroundColorPlugin,
  BaseFontColorPlugin,
  BaseFontFamilyPlugin,
  BaseFontSizePlugin
} from '@platejs/basic-styles';
import { BaseTextAlignPlugin } from '@platejs/basic-styles';
import { BaseLineHeightPlugin } from '@platejs/basic-styles';
import { BaseDatePlugin } from '@platejs/date';
import { BaseIndentPlugin } from '@platejs/indent';
import { BaseColumnItemPlugin, BaseColumnPlugin } from '@platejs/layout';
import { BaseLinkPlugin } from '@platejs/link';
import { BaseListPlugin } from '@platejs/list';
import { BaseEquationPlugin, BaseInlineEquationPlugin } from '@platejs/math';
import {
  BaseAudioPlugin,
  BaseFilePlugin,
  BaseImagePlugin,
  BaseMediaEmbedPlugin,
  BasePlaceholderPlugin,
  BaseVideoPlugin
} from '@platejs/media';
import {
  BaseTableCellHeaderPlugin,
  BaseTableCellPlugin,
  BaseTablePlugin,
  BaseTableRowPlugin
} from '@platejs/table';
import { BaseTocPlugin } from '@platejs/toc';
import { BaseTogglePlugin } from '@platejs/toggle';
import { KEYS, createSlateEditor } from 'platejs';
import { MarkdownKit } from './markdown-kit';
import { createPlateEditor } from 'platejs/react';

export const BaseTableKit = [
  BaseTablePlugin,
  BaseTableRowPlugin,
  BaseTableCellPlugin,
  BaseTableCellHeaderPlugin
];

const serverNode = [
  BaseBoldPlugin,
  BaseItalicPlugin,
  BaseH1Plugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseH4Plugin,
  BaseH5Plugin,
  BaseH6Plugin,
  BaseBasicBlocksPlugin,
  BaseBasicMarksPlugin,
  BaseBlockquotePlugin,
  BaseCodePlugin,
  BaseHeadingPlugin,
  BaseHighlightPlugin,
  BaseHorizontalRulePlugin,
  BaseKbdPlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseUnderlinePlugin,
  AutoformatPlugin,
  ...MarkdownKit,
  ...BaseTableKit,
  BaseTogglePlugin,
  BaseTocPlugin,
  BaseAudioPlugin,
  BaseFilePlugin,
  BaseImagePlugin,
  BaseMediaEmbedPlugin,
  BasePlaceholderPlugin,
  BaseVideoPlugin,
  BaseColumnPlugin,
  BaseColumnItemPlugin,
  // BaseEquationPlugin,
  // BaseInlineEquationPlugin,
  BaseDatePlugin,
  BaseLinkPlugin,
  BaseFontBackgroundColorPlugin,
  BaseFontColorPlugin,
  BaseFontFamilyPlugin,
  BaseFontSizePlugin,
  BaseTextAlignPlugin,
  BaseLineHeightPlugin,
  BaseListPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock, KEYS.toggle]
    }
  }),
  BaseIndentPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock, KEYS.toggle]
    }
  })
];

export const SERVER_EDITOR = createPlateEditor({
  plugins: serverNode
});
