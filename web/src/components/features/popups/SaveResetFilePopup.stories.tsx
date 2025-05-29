import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';
import { Button } from '@/components/ui/buttons';
import { SaveResetFilePopup } from './SaveResetFilePopup';

const meta: Meta<typeof SaveResetFilePopup> = {
  title: 'Features/Popups/SaveResetFilePopup',
  component: SaveResetFilePopup,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls whether the popup is visible'
    },
    onReset: {
      action: 'reset clicked',
      description: 'Function called when the reset button is clicked'
    },
    onSave: {
      action: 'save clicked',
      description: 'Function called when the save button is clicked'
    }
  }
};

export default meta;
type Story = StoryObj<typeof SaveResetFilePopup>;

// Helper component to control popup state in Storybook
const PopupContainer = (args: React.ComponentProps<typeof SaveResetFilePopup>) => {
  const [isOpen, setIsOpen] = React.useState(args.open);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleReset = () => {
    args.onReset();
    setIsOpen(false);
  };

  const handleSave = () => {
    args.onSave();
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button onClick={handleToggle}>{isOpen ? 'Hide Popup' : 'Show Popup'}</Button>
      <div className="relative h-32 w-[500px]">
        <SaveResetFilePopup open={isOpen} onReset={handleReset} onSave={handleSave} />
      </div>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <PopupContainer {...args} />,
  args: {
    open: true,
    onReset: fn(),
    onSave: fn()
  }
};

export const Hidden: Story = {
  render: (args) => <PopupContainer {...args} />,
  args: {
    open: false,
    onReset: fn(),
    onSave: fn()
  }
};
