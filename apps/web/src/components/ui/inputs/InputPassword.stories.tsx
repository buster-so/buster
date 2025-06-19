import type { Meta, StoryObj } from '@storybook/react';
import { InputPassword } from './InputPassword';

const meta: Meta<typeof InputPassword> = {
  title: 'UI/Inputs/InputPassword',
  component: InputPassword,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean'
    },
    value: {
      control: 'text'
    },
    onChange: { action: 'changed' },
    size: {
      control: 'select',
      options: ['default', 'tall', 'small']
    },
    variant: {
      control: 'select',
      options: ['default', 'ghost']
    }
  }
};

export default meta;
type Story = StoryObj<typeof InputPassword>;

export const Default: Story = {
  args: {
    placeholder: 'Enter password here...'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Password field (disabled)',
    value: 'Cannot edit this'
  }
};

export const WithValue: Story = {
  args: {
    value: 'Password123',
    placeholder: 'Enter password here...'
  }
};

export const Small: Story = {
  args: {
    size: 'small',
    placeholder: 'Small password input...'
  }
};

export const Tall: Story = {
  args: {
    size: 'tall',
    placeholder: 'Tall password input...'
  }
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    placeholder: 'Ghost password input...'
  }
};
