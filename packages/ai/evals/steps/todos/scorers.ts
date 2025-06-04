import { LLMClassifierFromTemplate } from 'autoevals';

export const todosCoverBareMinimum = LLMClassifierFromTemplate({
  name: 'todosCoverBareMinimum',
  promptTemplate: `
  Your task is to determine if the actual todo list cover the bare minimum of what is defined in the expected todo list.

  Return Y if it does, N if it does not.

  The actual todo list is:
  {{output}}

  The expected todo list is:
  {{expected}}
  `,
  choiceScores: {
    Y: 1,
    N: 0,
  },
});

export const todosContainMarkdownCheckboxes = ({ output }: { output: string }) => {
  return output.includes('[ ]') ? 1 : 0;
};
