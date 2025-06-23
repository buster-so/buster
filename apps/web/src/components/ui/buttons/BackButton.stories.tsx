import type { Meta, StoryObj } from '@storybook/react';
import { BackButton } from './BackButton';

const meta: Meta<typeof BackButton> = {
  title: 'UI/Buttons/BackButton',
  component: BackButton,
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'The text to display in the button'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply'
    },
    onClick: {
      action: 'clicked',
      description: 'Function to call when the button is clicked'
    },
    linkUrl: {
      control: 'text',
      description: 'URL to navigate to when clicked (uses Next.js Link)'
    },
    style: {
      control: 'object',
      description: 'Additional inline styles to apply'
    }
  }
};

export default meta;
type Story = StoryObj<typeof BackButton>;

export const Default: Story = {
  args: {
    text: 'Back'
  }
};

export const CustomText: Story = {
  args: {
    text: 'Go Back'
  }
};

export const WithLink: Story = {
  args: {
    text: 'Back to Home',
    linkUrl: '/'
  }
};

export const WithCustomStyle: Story = {
  args: {
    text: 'Back',
    style: {
      color: 'blue'
    }
  }
};

export const WithCustomClass: Story = {
  args: {
    text: 'Back',
    className: 'font-bold'
  }
};
