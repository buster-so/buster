import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Inputs/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default'],
      description: 'The visual style of the checkbox'
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
      description: 'The size of the checkbox'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled'
    },
    checked: {
      control: 'select',
      options: [true, false, 'indeterminate'],
      description: 'Whether the checkbox is checked (controlled)'
    },
    defaultChecked: {
      control: 'boolean',
      description: 'The default checked state (uncontrolled)'
    },
    onCheckedChange: {
      description: 'Callback when the checked state changes'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

// Default variant with all sizes
export const Default: Story = {
  args: {
    variant: 'default',
    size: 'default'
  }
};

export const Small: Story = {
  args: {
    variant: 'default',
    size: 'sm'
  }
};

export const Large: Story = {
  args: {
    variant: 'default',
    size: 'lg'
  }
};

// States
export const Checked: Story = {
  args: {
    checked: true,
    size: 'default'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    size: 'default'
  }
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
    size: 'default'
  }
};

// Example with event handler
export const WithOnChange: Story = {
  args: {
    onCheckedChange: (checked: boolean) => alert(`Checked: ${checked}`)
  }
};

// Example showing all sizes in a group
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Checkbox size="sm" />
      <Checkbox size="default" />
      <Checkbox size="lg" />
    </div>
  )
};

// Example showing different states
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Checkbox />
        <span className="text-sm">Default</span>
      </div>
      <div className="flex items-center gap-4">
        <Checkbox checked />
        <span className="text-sm">Checked</span>
      </div>
      <div className="flex items-center gap-4">
        <Checkbox disabled />
        <span className="text-sm">Disabled</span>
      </div>
      <div className="flex items-center gap-4">
        <Checkbox disabled checked />
        <span className="text-sm">Disabled Checked</span>
      </div>
    </div>
  )
};
