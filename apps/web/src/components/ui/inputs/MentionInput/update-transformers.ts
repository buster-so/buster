import type { Editor, NodeType, TextType } from '@tiptap/react';
import type {
  GetMentionOnChange,
  MentionArrayItem,
  MentionOnChange,
  MentionSuggestionExtension,
} from './MentionInput.types';
import type { MentionPillAttributes } from './MentionPill';

export const onUpdateTransformer = ({
  editor,
  mentionsByTrigger,
}: {
  editor: Editor;
  mentionsByTrigger: Record<string, MentionSuggestionExtension>;
}): MentionOnChange => {
  const editorText = editor.getText();
  const editorJson = editor.getJSON();

  let transformedValue = '';
  const arrayValue: MentionArrayItem[] = [];

  editorJson.content.forEach((paragraph, paragraphIndex) => {
    if (paragraph.type === 'paragraph') {
      // Handle paragraph content (text and mentions)
      if (paragraph.content && paragraph.content.length > 0) {
        paragraph.content.forEach((item) => {
          if (item.type === 'text') {
            const _item = item as TextType;
            arrayValue.push({ type: 'text', text: _item.text });
            transformedValue += _item.text;
          } else if (item.type === 'mention') {
            const _item = item as NodeType<'mention', MentionPillAttributes>;
            arrayValue.push({ type: 'mention', attrs: _item.attrs });

            const onChangeTransform = mentionsByTrigger[_item.attrs.trigger]?.onChangeTransform;
            if (onChangeTransform) {
              transformedValue += onChangeTransform(_item.attrs);
            } else {
              transformedValue += _item.attrs.label;
            }
          }
        });
      }

      // Add double newline after each paragraph to match TipTap's getText() behavior
      // TipTap adds \n\n between paragraphs (visible as single blank line)
      if (paragraphIndex < editorJson.content.length - 1) {
        arrayValue.push({ type: 'text', text: '\n' });
        transformedValue += '\n';
      }
    }
  });

  return {
    transformedValue,
    arrayValue,
    editorText,
  } satisfies MentionOnChange;
};
