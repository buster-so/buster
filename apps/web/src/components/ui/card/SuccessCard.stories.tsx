import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from '../buttons/Button';
import { SuccessCard } from './SuccessCard';

const meta: Meta<typeof SuccessCard> = {
  title: 'UI/Cards/SuccessCard',
  component: SuccessCard,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title of the success card'
    },
    message: {
      control: 'text',
      description: 'The message to display in the success card'
    },
    children: {
      control: 'text',
      description: 'Optional additional content to render below the message'
    },
    className: {
      control: 'text',
      description: 'Optional className to apply to the card'
    }
  }
};

export default meta;
type Story = StoryObj<typeof SuccessCard>;

export const Default: Story = {
  args: {
    title: 'Success!',
    message: 'Your action has been completed successfully.'
  }
};

export const WithChildren: Story = {
  args: {
    title: 'Payment Successful',
    message: 'Your payment has been processed successfully.',
    extra: (
      <div className="flex justify-center">
        <Button variant="primary" size="small" onClick={fn()}>
          View Receipt
        </Button>
      </div>
    )
  }
};

export const LongMessage: Story = {
  args: {
    title: 'Account Created',
    message:
      'Your account has been created successfully. You can now log in with your credentials and start using our platform. We have sent you a confirmation email with further instructions.'
  }
};

export const CustomWidth: Story = {
  args: {
    title: 'File Uploaded',
    message: 'Your file has been uploaded successfully.',
    className: 'max-w-md'
  }
};
