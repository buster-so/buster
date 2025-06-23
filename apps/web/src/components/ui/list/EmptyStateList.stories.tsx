import type { Meta, StoryObj } from '@storybook/react';
import { EmptyStateList } from './EmptyStateList';

const meta: Meta<typeof EmptyStateList> = {
  title: 'UI/List/EmptyStateList',
  component: EmptyStateList,
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'The text to display in the empty state'
    },
    variant: {
      control: 'radio',
      options: ['default', 'card'],
      description: 'The visual style of the empty state',
      defaultValue: 'default'
    },
    show: {
      control: 'boolean',
      description: 'Whether to show the empty state',
      defaultValue: true
    }
  }
};

export default meta;
type Story = StoryObj<typeof EmptyStateList>;

export const Default: Story = {
  args: {
    text: 'No items found',
    variant: 'default',
    show: true
  }
};

export const CardVariant: Story = {
  args: {
    text: 'No items found',
    variant: 'card',
    show: true
  }
};

export const Hidden: Story = {
  args: {
    text: 'This text will not be shown',
    show: false
  }
};

export const LongText: Story = {
  args: {
    text: 'This is a longer message that explains why there are no items in the list. It might provide some guidance on how to add items or what actions to take next.',
    variant: 'default',
    show: true
  }
};

export const CardWithLongText: Story = {
  args: {
    text: 'This is a longer message that explains why there are no items in the list. It might provide some guidance on how to add items or what actions to take next.',
    variant: 'card',
    show: true
  }
};
