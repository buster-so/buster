import type { Meta, StoryObj } from '@storybook/react';
import { MetricChartEvaluation } from './MetricChartEvaluation';

const meta: Meta<typeof MetricChartEvaluation> = {
  title: 'Controllers/MetricController/MetricChartEvaluation',
  component: MetricChartEvaluation,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof MetricChartEvaluation>;

export const HighConfidence: Story = {
  args: {
    evaluationScore: 'High',
    evaluationSummary:
      'This metric shows strong correlation with the target variable and has high statistical significance.'
  }
};

export const ModerateConfidence: Story = {
  args: {
    evaluationScore: 'Moderate',
    evaluationSummary:
      'This metric shows moderate correlation with some uncertainty in the statistical significance.'
  }
};

export const LowConfidence: Story = {
  args: {
    evaluationScore: 'Low',
    evaluationSummary: 'This metric shows weak correlation and requires further investigation.'
  }
};

export const NoConfidence: Story = {
  args: {
    evaluationScore: undefined,
    evaluationSummary: 'Unable to determine the confidence level for this metric.'
  }
};
