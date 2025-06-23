import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../buttons/Button';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'UI/Tooltip/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  args: {
    title: 'This is a tooltip',
    children: <Button>Hover me</Button>,
    align: 'center',
    side: 'top',
    open: undefined
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the tooltip is open'
    },
    title: {
      control: 'text',
      description: 'The text content of the tooltip'
    },
    shortcuts: {
      control: 'object',
      description: 'Array of keyboard shortcutss to display'
    },
    children: {
      control: 'object',
      description: 'The element that triggers the tooltip'
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end'],
      description: 'The alignment of the tooltip'
    },
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'The side of the element to show the tooltip'
    },
    delayDuration: {
      control: { type: 'number' },
      description: 'The delay duration in milliseconds before showing the tooltip',
      defaultValue: 200
    },
    skipDelayDuration: {
      control: { type: 'number' },
      description:
        'How long to wait before showing the tooltip when the same tooltip was recently shown',
      defaultValue: 300
    }
  }
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic tooltip
export const Basic: Story = {
  args: {
    title: 'Basic tooltip',
    children: <Button>Hover me</Button>
  }
};

// With keyboard shortcutss
export const WithShortcut: Story = {
  args: {
    title: 'Save file',
    shortcuts: ['S'],
    children: <Button>Save</Button>
  }
};

// Multiple shortcutss
export const MultipleShortcuts: Story = {
  args: {
    title: 'Undo action',
    shortcuts: ['⌘', 'Z'],
    children: <Button>Undo</Button>
  }
};

// Long content
export const LongContent: Story = {
  args: {
    title:
      'This is a very long tooltip that demonstrates how the component handles extended content in a single line',
    children: <Button>Long tooltip</Button>
  }
};

// Custom trigger element
export const CustomTrigger: Story = {
  args: {
    title: 'Custom element tooltip',
    children: (
      <div className="cursor-pointer text-blue-500 hover:text-blue-700">Hover over this text</div>
    )
  }
};
