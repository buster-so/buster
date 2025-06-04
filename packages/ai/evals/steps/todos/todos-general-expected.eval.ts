import { Eval, initDataset } from 'braintrust';
import { todosAgent } from '../../../src/steps/create-todos-step';
import { todosContainMarkdownCheckboxes, todosCoverBareMinimum } from './scorers';

const getTodos = async (input: string) => {
  const agent = await todosAgent.generate(input);

  const content = agent.response.messages[0]?.content;
  if (typeof content === 'string') {
    return content;
  }
  return Array.isArray(content) ? content.map((part: any) => part.text || part).join('\n') : '';
};

Eval('TODOS', {
  data: initDataset({
    project: 'TODOS',
    dataset: 'Todos General Expected' 
  }),
  task: getTodos,
  scores: [todosCoverBareMinimum, todosContainMarkdownCheckboxes],
});
