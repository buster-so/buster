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
  BaseUnderlinePlugin,
} from '@platejs/basic-nodes';
import { createSlateEditor } from 'platejs';
import { MarkdownPlugin } from './MarkdownPlugin';

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
  MarkdownPlugin,
];

export const SERVER_EDITOR = createSlateEditor({
  plugins: serverNode,
});
