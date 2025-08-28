import { wrapTraced } from 'braintrust';
import type {
  UpdateNotepadEdit,
  UpdateNotepadToolContext,
  UpdateNotepadToolInput,
  UpdateNotepadToolOutput,
} from './update-notepad-tool';

// Apply a single edit operation to the notepad content
function applyEditToContent(
  content: string,
  edit: UpdateNotepadEdit
): {
  success: boolean;
  content?: string;
  error?: string;
} {
  try {
    if (edit.operation === 'append') {
      // Append mode: add content to the end
      const separator = content && !content.endsWith('\n') ? '\n' : '';
      return {
        success: true,
        content: content + separator + edit.content,
      };
    }

    // Replace mode: find and replace specific content
    if (!edit.content_to_replace) {
      return {
        success: false,
        error: 'Replace operation requires content_to_replace',
      };
    }

    if (!content.includes(edit.content_to_replace)) {
      return {
        success: false,
        error: `Content not found: "${edit.content_to_replace.substring(0, 50)}${edit.content_to_replace.length > 50 ? '...' : ''}"`,
      };
    }

    const newContent = content.replace(edit.content_to_replace, edit.content);
    return {
      success: true,
      content: newContent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Edit operation failed',
    };
  }
}

export function createUpdateNotepadToolExecute(context: UpdateNotepadToolContext) {
  return wrapTraced(
    async (input: UpdateNotepadToolInput): Promise<UpdateNotepadToolOutput> => {
      const { edits } = input;

      let currentContent = context.notepad;
      const errors: string[] = [];

      // Apply each edit sequentially
      for (const edit of edits) {
        const result = applyEditToContent(currentContent, edit);

        if (result.success && result.content !== undefined) {
          currentContent = result.content;
        } else {
          errors.push(result.error || 'Unknown error during edit');
        }
      }

      // Update the context with the final content
      if (errors.length === 0) {
        Object.assign(context, { notepad: currentContent });
      }

      return {
        success: errors.length === 0,
        updatedNotepad: currentContent,
        errors: errors.length > 0 ? errors : undefined,
      };
    },
    { name: 'update-notepad-execute' }
  );
}
