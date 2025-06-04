import braintrust from 'braintrust';

const project = braintrust.projects.create({ name: 'TODOS' });

project.scorers.create({
  name: "Equality LLM scorer",
  slug: "equality-llm-scorer",
  description: "An equality LLM scorer",
  messages: [
    {
      role: "user",
      content:
        'Return "A" if {{output}} is equal to {{expected}}, and "B" otherwise.',
    },
  ],
  model: "gpt-4o",
  useCot: true,
  choiceScores: {
    A: 1,
    B: 0,
  },
});
