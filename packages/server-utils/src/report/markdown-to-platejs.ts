import { ReportElementsSchema } from '@buster/database';
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

const SERVER_EDITOR = createSlateEditor({
  plugins: serverNode,
});

export const markdownToPlatejs = async (markdown: string) => {
  const descendants = SERVER_EDITOR.api.markdown.deserialize(markdown);

  const safeParsedElements = ReportElementsSchema.safeParse(descendants);

  return {
    error: safeParsedElements.error,
    elements: safeParsedElements.data,
    descendants,
    markdown,
  };
};
