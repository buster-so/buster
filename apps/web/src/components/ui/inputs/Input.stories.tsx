import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Inputs/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'ghost']
    },
    size: {
      control: 'select',
      options: ['default', 'tall', 'small']
    },
    disabled: {
      control: 'boolean'
    },
    placeholder: {
      control: 'text'
    },
    type: {
      control: 'select',
      options: ['text', 'textarea', 'number', 'email', 'password']
    }
  }
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text here...'
  }
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    placeholder: 'Ghost input...'
  }
};

export const Tall: Story = {
  args: {
    size: 'tall',
    placeholder: 'Tall input...'
  }
};

export const Small: Story = {
  args: {
    size: 'small',
    placeholder: 'Small input...'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
    value: 'Cannot edit this'
  }
};
