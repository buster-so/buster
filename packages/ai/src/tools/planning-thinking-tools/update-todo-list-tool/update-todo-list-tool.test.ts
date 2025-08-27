import { beforeEach, describe, expect, it } from 'vitest';
import { createUpdateTodoListTool } from './update-todo-list-tool';
import type { UpdateTodoListToolInput, UpdateTodoListToolOutput } from './update-todo-list-tool';

describe('updateTodoListTool', () => {
  let updateTodoListTool: ReturnType<typeof createUpdateTodoListTool>;
  let currentTodoList: string;

  // Helper to call execute with a concrete signature
  const run = async (input: UpdateTodoListToolInput): Promise<UpdateTodoListToolOutput> => {
    const exec = updateTodoListTool.execute as (
      i: UpdateTodoListToolInput
    ) => Promise<UpdateTodoListToolOutput>;
    return exec(input);
  };

  beforeEach(() => {
    currentTodoList = '## Todo List\n- [ ] Initial task';
    updateTodoListTool = createUpdateTodoListTool({
      todoList: currentTodoList,
    });
  });

  it('should update the todo list successfully', async () => {
    const newTodoList = `## Todo List
- [x] Initial task
- [ ] Write unit tests
- [ ] Implement feature`;

    const result = await run({
      todoList: newTodoList,
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toBe(newTodoList);
    expect(result.message).toBe('Todo list updated successfully');
  });

  it('should handle empty todo list', async () => {
    const result = await run({
      todoList: '',
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toBe('');
    expect(result.message).toBe('Todo list cleared');
  });

  it('should handle todo list with only whitespace', async () => {
    const result = await run({
      todoList: '   \n   \n   ',
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toBe('   \n   \n   ');
    expect(result.message).toBe('Todo list cleared');
  });

  it('should update with complex markdown formatting', async () => {
    const complexTodoList = `## Todo List

### High Priority
- [x] Critical bug fix
- [ ] Security patch

### Medium Priority
- [ ] Feature A
- [ ] Feature B

### Low Priority
- [ ] Documentation
- [ ] Cleanup old code`;

    const result = await run({
      todoList: complexTodoList,
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toBe(complexTodoList);
    expect(result.message).toBe('Todo list updated successfully');
  });

  it('should handle todo list with various markdown elements', async () => {
    const markdownTodoList = `## Todo List

**Important Tasks:**
- [ ] Task 1 with **bold** text
- [ ] Task 2 with *italic* text
- [ ] Task 3 with \`code\` formatting

> Note: These are important tasks

1. Numbered item 1
2. Numbered item 2`;

    const result = await run({
      todoList: markdownTodoList,
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toBe(markdownTodoList);
    expect(result.message).toBe('Todo list updated successfully');
  });
});
