import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  title: 'UI/Slider/Slider',
  component: Slider,
  tags: ['autodocs'],
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    showTooltip: true
  },
  argTypes: {
    min: {
      control: 'number',
      description: 'Minimum value of the slider'
    },
    max: {
      control: 'number',
      description: 'Maximum value of the slider'
    },
    step: {
      control: 'number',
      description: 'Step size for slider increments'
    },
    defaultValue: {
      control: 'object',
      description: 'Default value of the slider (array of numbers)'
    },
    value: {
      control: 'object',
      description: 'Current value of the slider (array of numbers)'
    },
    showTooltip: {
      control: 'boolean',
      description: 'Whether to show tooltip while sliding or hovering'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the slider is disabled'
    },
    onValueChange: {
      action: 'valueChanged',
      description: 'Callback when value changes'
    },
    onValueCommit: {
      action: 'valueCommitted',
      description: 'Callback when value is committed'
    }
  }
};

export default meta;

type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    defaultValue: [50]
  }
};

export const WithRange: Story = {
  args: {
    defaultValue: [25, 75]
  }
};

export const WithCustomMinMax: Story = {
  args: {
    min: 1000,
    max: 5000,
    defaultValue: [2500]
  }
};

export const WithCustomStep: Story = {
  args: {
    min: 0,
    max: 100,
    step: 10,
    defaultValue: [40]
  }
};

export const WithoutTooltip: Story = {
  args: {
    defaultValue: [50],
    showTooltip: false
  }
};

export const Disabled: Story = {
  args: {
    defaultValue: [50],
    disabled: true
  }
};
