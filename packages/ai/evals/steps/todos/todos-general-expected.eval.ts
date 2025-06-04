import { Eval, initDataset } from 'braintrust';
import { createTodosOutputSchema, todosAgent } from '../../../src/steps/create-todos-step';
import { todosContainMarkdownCheckboxes, todosCoverBareMinimum } from './scorers';

const getTodos = async (input: string) => {
  const response = await todosAgent.generate(input, {
    output: createTodosOutputSchema,
  });

  return response.object.todos;
};

Eval('TODOS', {
  data: initDataset({
    project: 'TODOS',
    dataset: 'Todos General Expected',
  }),
  task: getTodos,
  scores: [todosCoverBareMinimum, todosContainMarkdownCheckboxes],
});
