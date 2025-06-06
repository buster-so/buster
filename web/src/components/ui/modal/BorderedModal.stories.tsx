import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { BorderedModal } from './BorderedModal';

const meta: Meta<typeof BorderedModal> = {
  title: 'UI/Modal/ScrollableModal',
  component: BorderedModal,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof BorderedModal>;

// Wrapper component to handle state
const ScrollableModalWrapper = (args: any) => {
  const [open, setOpen] = useState(true);
  return <BorderedModal {...args} open={open} onOpenChange={setOpen} />;
};

export const Basic: Story = {
  render: (args) => <ScrollableModalWrapper {...args} />,
  args: {
    header: {
      title: 'Example Modal',
      description: 'This is a basic example of the ScrollableModal component'
    },
    children: (
      <div className="space-y-4 py-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={i}>This is paragraph {i + 1} demonstrating scrollable content in the modal.</p>
        ))}
      </div>
    ),
    footer: {
      primaryButton: {
        text: 'Save Changes',
        onClick: fn()
      },
      secondaryButton: {
        text: 'Cancel',
        onClick: fn(),
        variant: 'ghost'
      }
    },
    width: 600
  }
};

export const WithCustomHeader: Story = {
  render: (args) => <ScrollableModalWrapper {...args} />,
  args: {
    header: (
      <div className="flex flex-col space-y-2 text-center">
        <h3 className="text-2xl font-bold tracking-tight">Custom Header</h3>
        <p className="text-gray-light">This example shows how to use a custom header component</p>
      </div>
    ),
    children: (
      <div className="space-y-4 py-4">
        <p>Modal content with custom header styling.</p>
        <p>You can add any React node as the header content.</p>
      </div>
    ),
    footer: {
      left: <span className="text-gray-light text-sm">Footer left content</span>,
      primaryButton: {
        text: 'Confirm',
        onClick: fn(),
        variant: 'black'
      },
      secondaryButton: {
        text: 'Back',
        onClick: fn(),
        variant: 'ghost'
      }
    },
    width: 500
  }
};

export const LoadingState: Story = {
  render: (args) => <ScrollableModalWrapper {...args} />,
  args: {
    header: {
      title: 'Loading State Example',
      description: 'This example shows the modal with loading state in buttons'
    },
    children: (
      <div className="py-4">
        <p>Modal content with loading state buttons.</p>
      </div>
    ),
    footer: {
      primaryButton: {
        text: 'Submit',
        onClick: () => new Promise((resolve) => setTimeout(resolve, 2000)),
        loading: true
      },
      secondaryButton: {
        text: 'Cancel',
        onClick: fn(),
        variant: 'ghost',
        disabled: true
      }
    },
    width: 400
  }
};
