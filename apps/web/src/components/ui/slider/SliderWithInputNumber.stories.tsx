import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { SliderWithInputNumber } from './SliderWithInputNumber';

const meta: Meta<typeof SliderWithInputNumber> = {
  title: 'UI/Slider/SliderWithInputNumber',
  component: SliderWithInputNumber,
  tags: ['autodocs'],
  args: {
    min: 0,
    max: 100,
    value: 50,
    onChange: fn()
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
    value: {
      control: 'number',
      description: 'Current value of the slider'
    },
    onChange: {
      action: 'changed',
      description: 'Callback when value changes'
    }
  }
};

export default meta;

type Story = StoryObj<typeof SliderWithInputNumber>;

export const Default: Story = {
  args: {
    value: 50
  }
};

export const WithCustomMinMax: Story = {
  args: {
    min: 1000,
    max: 5000,
    value: 2500
  }
};

export const WithLowValue: Story = {
  args: {
    value: 10
  }
};

export const WithHighValue: Story = {
  args: {
    value: 90
  }
};
