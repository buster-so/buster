import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'UI/Inputs/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    checked: { control: 'boolean' }
  }
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {}
};

export const Checked: Story = {
  args: {
    defaultChecked: true
  }
};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true
  }
};

export const WithCustomClassName: Story = {
  args: {
    className: 'data-[state=checked]:bg-green-500',
    defaultChecked: true
  }
};
