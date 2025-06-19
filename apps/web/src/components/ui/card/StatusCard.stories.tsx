import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from '../buttons';
import { StatusCard } from './StatusCard';

const meta: Meta<typeof StatusCard> = {
  title: 'UI/Cards/StatusCard',
  component: StatusCard,
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'The error message to display'
    },
    title: {
      control: 'text',
      description: 'Optional title for the error alert'
    },
    variant: {
      control: { type: 'select' },
      options: ['danger', 'default', 'success'],
      description: 'The visual style of the error alert'
    }
  }
};

export default meta;
type Story = StoryObj<typeof StatusCard>;

export const Default: Story = {
  args: {
    message: 'Something went wrong. Please try again later.',
    title: 'Error',
    variant: 'default'
  }
};

export const Danger: Story = {
  args: {
    message: 'Failed to save changes. Please check your connection and try again.',
    title: 'Connection Error',
    variant: 'danger'
  }
};

export const WithoutTitle: Story = {
  args: {
    message: 'This is an error message without a title.',
    variant: 'default'
  }
};

export const LongErrorMessage: Story = {
  args: {
    message:
      'This is a very long error message that might wrap to multiple lines. It contains detailed information about what went wrong and possibly some suggestions on how to fix the issue.',
    title: 'Detailed Error',
    variant: 'danger'
  }
};

export const WithExtra: Story = {
  args: {
    message: 'Operation completed successfully.',
    title: 'Success',

    extra: [
      <Button key="login" variant="default" onClick={fn()}>
        Go to Login
      </Button>
    ]
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-[300px]">
        <Story />
      </div>
    )
  ]
};
