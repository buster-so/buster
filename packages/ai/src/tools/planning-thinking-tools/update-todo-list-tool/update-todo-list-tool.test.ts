import { beforeEach, describe, expect, it } from 'vitest';
import { createUpdateTodoListTool } from './update-todo-list-tool';
import type { UpdateTodoListToolInput, UpdateTodoListToolOutput } from './update-todo-list-tool';

describe('updateTodoListTool', () => {
  let updateTodoListTool: ReturnType<typeof createUpdateTodoListTool>;
  let context: { todoList: string };

  // Helper to call execute with a concrete signature
  const run = async (input: UpdateTodoListToolInput): Promise<UpdateTodoListToolOutput> => {
    const exec = updateTodoListTool.execute as (
      i: UpdateTodoListToolInput
    ) => Promise<UpdateTodoListToolOutput>;
    return exec(input);
  };

  beforeEach(() => {
    const initialTodoList = '## Todo List\n- [ ] Initial task';
    context = { todoList: initialTodoList };
    updateTodoListTool = createUpdateTodoListTool(context);
  });

  describe('replace operations', () => {
    it('should replace specific content in the todo list', async () => {
      const result = await run({
        edits: [
          {
            operation: 'replace',
            content_to_replace: '- [ ] Initial task',
            content: '- [x] Initial task',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updatedTodoList).toBe('## Todo List\n- [x] Initial task');
      expect(result.errors).toBeUndefined();
    });

    it('should handle multiple replace operations sequentially', async () => {
      const result = await run({
        edits: [
          {
            operation: 'replace',
            content_to_replace: '## Todo List',
            content: '## My Todo List',
          },
          {
            operation: 'replace',
            content_to_replace: '- [ ] Initial task',
            content: '- [x] Initial task\n- [ ] Second task',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updatedTodoList).toBe('## My Todo List\n- [x] Initial task\n- [ ] Second task');
      expect(result.errors).toBeUndefined();
    });

    it('should fail when content to replace is not found', async () => {
      const result = await run({
        edits: [
          {
            operation: 'replace',
            content_to_replace: '- [ ] Non-existent task',
            content: '- [x] Non-existent task',
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.updatedTodoList).toBe('## Todo List\n- [ ] Initial task');
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Content not found');
    });

    it('should fail when content_to_replace is missing for replace operation', async () => {
      const result = await run({
        edits: [
          {
            operation: 'replace',
            content_to_replace: '',
            content: '- [ ] New task',
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Replace operation requires content_to_replace');
    });
  });

  describe('append operations', () => {
    it('should append content to the end of the todo list', async () => {
      const result = await run({
        edits: [
          {
            operation: 'append',
            content_to_replace: '',
            content: '- [ ] New appended task',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updatedTodoList).toBe(
        '## Todo List\n- [ ] Initial task\n- [ ] New appended task'
      );
      expect(result.errors).toBeUndefined();
    });

    it('should handle multiple append operations', async () => {
      const result = await run({
        edits: [
          {
            operation: 'append',
            content_to_replace: '',
            content: '- [ ] Task 2',
          },
          {
            operation: 'append',
            content_to_replace: '',
            content: '- [ ] Task 3',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updatedTodoList).toBe(
        '## Todo List\n- [ ] Initial task\n- [ ] Task 2\n- [ ] Task 3'
      );
      expect(result.errors).toBeUndefined();
    });

    it('should append to an empty todo list', async () => {
      context.todoList = '';
      updateTodoListTool = createUpdateTodoListTool(context);

      const result = await run({
        edits: [
          {
            operation: 'append',
            content_to_replace: '',
            content: '## New Todo List\n- [ ] First task',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updatedTodoList).toBe('## New Todo List\n- [ ] First task');
      expect(result.errors).toBeUndefined();
    });

    it('should append with proper formatting when content ends with newline', async () => {
      context.todoList = '## Todo List\n- [ ] Initial task\n';
      updateTodoListTool = createUpdateTodoListTool(context);

      const result = await run({
        edits: [
          {
            operation: 'append',
            content_to_replace: '',
            content: '- [ ] New task',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updatedTodoList).toBe('## Todo List\n- [ ] Initial task\n- [ ] New task');
      expect(result.errors).toBeUndefined();
    });
  });

  describe('mixed operations', () => {
    it('should handle a mix of append and replace operations', async () => {
      const result = await run({
        edits: [
          {
            operation: 'replace',
            content_to_replace: '- [ ] Initial task',
            content: '- [x] Initial task',
          },
          {
            operation: 'append',
            content_to_replace: '',
            content: '\n### New Section\n- [ ] New task',
          },
          {
            operation: 'replace',
            content_to_replace: '## Todo List',
            content: '## Updated Todo List',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updatedTodoList).toBe(
        '## Updated Todo List\n- [x] Initial task\n\n### New Section\n- [ ] New task'
      );
      expect(result.errors).toBeUndefined();
    });

    it('should continue processing when some operations fail', async () => {
      const result = await run({
        edits: [
          {
            operation: 'replace',
            content_to_replace: '- [ ] Non-existent',
            content: '- [x] Non-existent',
          },
          {
            operation: 'append',
            content_to_replace: '',
            content: '- [ ] This should still append',
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.updatedTodoList).toContain('- [ ] This should still append');
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBe(1);
    });
  });

  describe('complex markdown content', () => {
    it('should handle complex markdown formatting', async () => {
      context.todoList = `## Todo List

### High Priority
- [x] Critical bug fix
- [ ] Security patch`;

      updateTodoListTool = createUpdateTodoListTool(context);

      const result = await run({
        edits: [
          {
            operation: 'append',
            content_to_replace: '',
            content: '\n### Medium Priority\n- [ ] Feature A\n- [ ] Feature B',
          },
          {
            operation: 'replace',
            content_to_replace: '- [ ] Security patch',
            content: '- [x] Security patch',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updatedTodoList).toContain('### High Priority');
      expect(result.updatedTodoList).toContain('- [x] Security patch');
      expect(result.updatedTodoList).toContain('### Medium Priority');
      expect(result.updatedTodoList).toContain('- [ ] Feature A');
    });

    it('should handle markdown with various elements', async () => {
      context.todoList = `## Todo List

**Important Tasks:**
- [ ] Task with **bold** text`;

      updateTodoListTool = createUpdateTodoListTool(context);

      const result = await run({
        edits: [
          {
            operation: 'replace',
            content_to_replace: '- [ ] Task with **bold** text',
            content: '- [x] Task with **bold** text',
          },
          {
            operation: 'append',
            content_to_replace: '',
            content: '- [ ] Task with *italic* text\n- [ ] Task with `code` formatting',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updatedTodoList).toContain('- [x] Task with **bold** text');
      expect(result.updatedTodoList).toContain('- [ ] Task with *italic* text');
      expect(result.updatedTodoList).toContain('- [ ] Task with `code` formatting');
    });
  });

  describe('context updates', () => {
    it('should update the context on successful operations', async () => {
      const result = await run({
        edits: [
          {
            operation: 'append',
            content_to_replace: '',
            content: '- [ ] New task',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(context.todoList).toBe(result.updatedTodoList);
    });

    it('should not update context when operations fail', async () => {
      const originalContent = context.todoList;

      const result = await run({
        edits: [
          {
            operation: 'replace',
            content_to_replace: 'non-existent',
            content: 'replacement',
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(context.todoList).toBe(originalContent);
    });
  });
});
