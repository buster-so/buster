'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { AppModal } from './AppModal';
import { Button } from '../buttons/Button';
import React from 'react';
import type { ModalProps } from './AppModal';
import { fn } from '@storybook/test';
import { timeout } from '@/lib';

const meta: Meta<typeof AppModal> = {
  title: 'UI/Modal/AppModal',
  component: AppModal,
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls whether the modal is open or closed'
    },
    onClose: {
      action: 'closed',
      description: 'Function called when the modal is closed'
    },
    width: {
      control: { type: 'number', min: 300, max: 1200, step: 50 },
      description: 'Width of the modal in pixels'
    },
    header: {
      description: 'Header configuration with title and optional description'
    },
    footer: {
      description: 'Footer configuration with primary and optional secondary buttons'
    }
  },
  parameters: {
    layout: 'centered'
  }
};

export default meta;
type Story = StoryObj<typeof AppModal>;

// Helper component to control modal state in Storybook
const ModalContainer = (args: ModalProps) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const modalProps = {
    ...args,
    open: isOpen,
    onClose: handleClose,
    footer: {
      ...args.footer,
      primaryButton: {
        ...args.footer.primaryButton,
        onClick: () => {
          args.footer.primaryButton.onClick?.();
          handleClose();
        }
      },
      secondaryButton: args.footer.secondaryButton
        ? {
            ...args.footer.secondaryButton,
            onClick: () => {
              args.footer.secondaryButton?.onClick?.();
              handleClose();
            }
          }
        : undefined
    }
  };

  return (
    <div>
      <Button onClick={handleOpen}>Open Modal</Button>
      <AppModal {...modalProps} />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <ModalContainer {...args} />,
  args: {
    header: {
      title: 'Modal Title',
      description: 'This is a description of the modal'
    },
    footer: {
      primaryButton: {
        text: 'Confirm',
        onClick: fn()
      },
      secondaryButton: {
        text: 'Cancel',
        onClick: fn()
      }
    },
    width: 600,
    children: (
      <div className="">
        <p>This is the content of the modal.</p>
        <p className="mt-2">You can put any React components here.</p>
      </div>
    )
  }
};

export const WithoutDescription: Story = {
  render: (args) => <ModalContainer {...args} />,
  args: {
    header: {
      title: 'Simple Modal'
    },
    footer: {
      primaryButton: {
        text: 'OK',
        onClick: fn()
      }
    },
    width: 500,
    children: (
      <div className="">
        <p>A modal without a description and secondary button.</p>
      </div>
    )
  }
};

export const LoadingState: Story = {
  render: (args) => <ModalContainer {...args} />,
  args: {
    header: {
      title: 'Processing Data',
      description: 'Please wait while we process your request'
    },
    footer: {
      primaryButton: {
        text: 'Submit',
        onClick: fn(),
        loading: true
      },
      secondaryButton: {
        text: 'Cancel',
        onClick: fn(),
        disabled: true
      }
    },
    width: 550,
    children: (
      <div className="">
        <p>This modal shows loading and disabled states for buttons.</p>
      </div>
    )
  }
};

export const CustomWidth: Story = {
  render: (args) => <ModalContainer {...args} />,
  args: {
    header: {
      title: 'Wide Modal',
      description: 'This modal has a custom width'
    },
    footer: {
      primaryButton: {
        text: 'Save',
        onClick: fn()
      },
      secondaryButton: {
        text: 'Discard',
        onClick: fn()
      }
    },
    width: 300,
    children: (
      <div className="">
        <p>This is a wider modal that can be used for displaying more content.</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded border p-4">Column 1 content</div>
          <div className="rounded border p-4">Column 2 content</div>
        </div>
      </div>
    )
  }
};

export const WithCustomFooterLeft: Story = {
  render: (args) => <ModalContainer {...args} />,
  args: {
    header: {
      title: 'Custom Footer',
      description: 'This modal has custom content in the left side of the footer'
    },
    footer: {
      left: <span className="text-sm text-gray-500">Additional footer information</span>,
      primaryButton: {
        text: 'Continue',
        onClick: fn()
      },
      secondaryButton: {
        text: 'Back',
        onClick: fn()
      }
    },
    width: 600,
    children: (
      <div className="">
        <p>Notice the additional text on the left side of the footer.</p>
      </div>
    )
  }
};
