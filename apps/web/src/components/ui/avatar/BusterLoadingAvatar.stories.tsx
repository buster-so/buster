import type { Meta, StoryObj } from '@storybook/react';
import { BusterLoadingAvatar } from './BusterLoadingAvatar';

const meta: Meta<typeof BusterLoadingAvatar> = {
  title: 'UI/Avatar/BusterLoadingAvatar',
  component: BusterLoadingAvatar,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    loading: {
      control: 'boolean',
      description: 'Whether the avatar is in loading state'
    },
    variant: {
      control: 'select',
      options: ['default', 'gray'],
      description: 'Visual variant of the avatar'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    loading: true,
    variant: 'default'
  }
};

export const Gray: Story = {
  args: {
    loading: true,
    variant: 'gray'
  }
};

export const Loading: Story = {
  args: {
    loading: true,
    variant: 'default'
  }
};

export const NotLoading: Story = {
  args: {
    loading: false,
    variant: 'default'
  }
};

export const WithCustomClass: Story = {
  args: {
    loading: true,
    variant: 'default',
    className: 'w-16 h-16 bg-blue-50'
  }
};
