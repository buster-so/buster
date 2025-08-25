import type { Descendant } from 'platejs';
import type { IReportEditor } from '../../ReportEditor';
import { Value } from 'platejs';

export const markdownToPlatejs = async (
  editor: IReportEditor,
  markdown: string
): Promise<Value> => {
  try {
    const descendants: Value = editor.api.markdown.deserialize(markdown);
    const descendantsWithIds: Value = descendants.map((element, index) => ({
      ...element,
      id: `id-${index}`
    }));
    return descendantsWithIds;
  } catch (error) {
    console.error('Error converting markdown to PlateJS:', error);
    return [];
  }
};

export const platejsToMarkdown = async (
  editor: IReportEditor,
  elements: Value
): Promise<string> => {
  return editor.api.markdown.serialize({ value: elements as Descendant[] });
};
