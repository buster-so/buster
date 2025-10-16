import { beforeEach, describe, expect, it } from 'vitest';
import type {
  CheckOffTodoListToolInput,
  CheckOffTodoListToolOutput,
} from './check-off-todo-list-tool';
import { createCheckOffTodoListTool } from './check-off-todo-list-tool';

describe('checkOffTodoList', () => {
  let checkOffTodoListTool: ReturnType<typeof createCheckOffTodoListTool>;
  let todoList: string;
  let updateTodoListCalled: boolean;

  // Helper to call execute with a concrete signature
  const run = async (input: CheckOffTodoListToolInput): Promise<CheckOffTodoListToolOutput> => {
    const exec = checkOffTodoListTool.execute as (
      i: CheckOffTodoListToolInput
    ) => Promise<CheckOffTodoListToolOutput>;
    return exec(input);
  };

  beforeEach(() => {
    todoList = '';
    updateTodoListCalled = false;
    checkOffTodoListTool = createCheckOffTodoListTool({
      get todoList() {
        return todoList;
      },
      updateTodoList: (newList: string) => {
        todoList = newList;
        updateTodoListCalled = true;
      },
    });
  });

  it('should check off a single todo item successfully', async () => {
    todoList = `## Todo List
- [ ] Write unit tests
- [ ] Implement feature
- [ ] Review code`;

    const result = await run({
      todoItems: ['Write unit tests'],
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toContain('- [x] Write unit tests');
    expect(result.updatedTodoList).toContain('- [ ] Implement feature');
    expect(result.updatedTodoList).toContain('- [ ] Review code');
    expect(result.message).toBe('Successfully checked off all 1 items');
    expect(result.checkedOffItems).toEqual(['Write unit tests']);
    expect(result.failedItems).toEqual([]);

    // Verify context was updated
    expect(updateTodoListCalled).toBe(true);
    expect(todoList).toBe(result.updatedTodoList);
  });

  it('should check off multiple todo items successfully', async () => {
    todoList = `## Todo List
- [ ] Write unit tests
- [ ] Implement feature
- [ ] Review code
- [ ] Deploy to production`;

    const result = await run({
      todoItems: ['Write unit tests', 'Review code'],
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toContain('- [x] Write unit tests');
    expect(result.updatedTodoList).toContain('- [ ] Implement feature');
    expect(result.updatedTodoList).toContain('- [x] Review code');
    expect(result.updatedTodoList).toContain('- [ ] Deploy to production');
    expect(result.message).toBe('Successfully checked off all 2 items');
    expect(result.checkedOffItems).toEqual(['Write unit tests', 'Review code']);
    expect(result.failedItems).toEqual([]);
  });

  it('should handle partial success when some items are not found', async () => {
    todoList = `## Todo List
- [ ] Write unit tests
- [ ] Implement feature
- [ ] Review code`;

    const result = await run({
      todoItems: ['Write unit tests', 'Non-existent task', 'Review code'],
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toContain('- [x] Write unit tests');
    expect(result.updatedTodoList).toContain('- [ ] Implement feature');
    expect(result.updatedTodoList).toContain('- [x] Review code');
    expect(result.message).toBe('Successfully checked off 2 out of 3 items');
    expect(result.checkedOffItems).toEqual(['Write unit tests', 'Review code']);
    expect(result.failedItems).toEqual(['Non-existent task']);
  });

  it('should return error when todo list is not found in context', async () => {
    todoList = '';

    const result = await run({
      todoItems: ['Some task', 'Another task'],
    });

    expect(result.success).toBe(false);
    expect(result.updatedTodoList).toBe('');
    expect(result.message).toBe('No todo list found in context');
    expect(result.checkedOffItems).toEqual([]);
    expect(result.failedItems).toEqual(['Some task', 'Another task']);
  });

  it('should return error when no items could be checked off', async () => {
    todoList = `## Todo List
- [ ] Write unit tests
- [ ] Implement feature`;

    const result = await run({
      todoItems: ['Non-existent task', 'Another missing task'],
    });

    expect(result.success).toBe(false);
    expect(result.updatedTodoList).toBe(todoList);
    expect(result.message).toBe(
      'No items were checked off - they may not exist or are already checked'
    );
    expect(result.checkedOffItems).toEqual([]);
    expect(result.failedItems).toEqual(['Non-existent task', 'Another missing task']);
  });

  it('should not check off already checked items', async () => {
    todoList = `## Todo List
- [x] Write unit tests
- [ ] Implement feature
- [ ] Review code`;

    const result = await run({
      todoItems: ['Write unit tests', 'Implement feature'],
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toContain('- [x] Write unit tests');
    expect(result.updatedTodoList).toContain('- [x] Implement feature');
    expect(result.message).toBe('Successfully checked off 1 out of 2 items');
    expect(result.checkedOffItems).toEqual(['Implement feature']);
    expect(result.failedItems).toEqual(['Write unit tests']);
  });

  it('should handle empty array of todo items', async () => {
    todoList = `## Todo List
- [ ] Write unit tests`;

    const result = await run({
      todoItems: [],
    });

    expect(result.success).toBe(false);
    expect(result.updatedTodoList).toBe(todoList);
    expect(result.checkedOffItems).toEqual([]);
    expect(result.failedItems).toEqual([]);
  });

  it('should handle first occurrence when there are duplicates', async () => {
    todoList = `## Todo List
- [ ] Write unit tests
- [ ] Write unit tests
- [ ] Implement feature`;

    const result = await run({
      todoItems: ['Write unit tests'],
    });

    expect(result.success).toBe(true);
    // Only the first occurrence should be checked off
    const lines = result.updatedTodoList.split('\n');
    expect(lines[1]).toBe('- [x] Write unit tests');
    expect(lines[2]).toBe('- [ ] Write unit tests');
    expect(result.checkedOffItems).toEqual(['Write unit tests']);
  });
});
