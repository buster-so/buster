import { wrapTraced } from 'braintrust';
import type {
  UpdateTodoListToolContext,
  UpdateTodoListToolInput,
  UpdateTodoListToolOutput,
  UpdateTodoListEdit,
} from './update-todo-list-tool';

// Apply a single edit operation to the todo list content
function applyEditToContent(
  content: string,
  edit: UpdateTodoListEdit
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

export function createUpdateTodoListToolExecute(context: UpdateTodoListToolContext) {
  return wrapTraced(
    async (input: UpdateTodoListToolInput): Promise<UpdateTodoListToolOutput> => {
      const { edits } = input;
      
      let currentContent = context.todoList;
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
        Object.assign(context, { todoList: currentContent });
      }
      
      return {
        success: errors.length === 0,
        updatedTodoList: currentContent,
        errors: errors.length > 0 ? errors : undefined,
      };
    },
    { name: 'update-todo-list-execute' }
  );
}