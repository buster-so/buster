import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../buttons/Button';
import { Popover } from './Popover';

const meta = {
  title: 'UI/Tooltip/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    content: {
      description: 'The content to display in the popover'
    },
    children: {
      description: 'The trigger element that opens the popover'
    }
  }
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  args: {
    children: <Button>Click me</Button>,
    content: <div className="p-0">This is a popover content</div>
  }
};

export const WithCustomPosition: Story = {
  args: {
    children: <Button>Custom Position</Button>,
    content: <div className="p-0">This popover has custom positioning</div>
  },
  render: (args) => (
    <div className="flex items-center justify-center p-16">
      <Popover {...args} />
    </div>
  )
};

export const WithLongContent: Story = {
  args: {
    children: <Button>Long Content</Button>,
    content: (
      <div className="max-w-xs p-0">
        <p>
          This is a longer piece of content that demonstrates how the popover handles more text and
          structured content.
        </p>
      </div>
    )
  }
};

export const CustomAlignment: Story = {
  args: {
    children: <Button>Aligned Start</Button>,
    content: <div className="p-0 text-base">This popover is aligned to the start</div>,
    align: 'start',
    side: 'bottom'
  }
};

export const CustomClassName: Story = {
  args: {
    children: <Button>Custom Styled</Button>,
    content: <div className="p-0 text-base">Custom styled popover</div>,
    className: 'bg-blue-100 border-blue-300',
    align: 'center',
    side: 'bottom'
  }
};

export const WithHeaderContent: Story = {
  args: {
    children: <Button>With Header</Button>,
    content: <div className="text-base">This is the main content of the popover</div>,
    align: 'center',
    side: 'bottom'
  }
};

export const WithCustomHeaderContent: Story = {
  args: {
    children: <Button>Custom Header</Button>,
    content: <div className="text-base">Detailed information below the custom header</div>,
    align: 'center',
    side: 'bottom'
  }
};

export const WithTriggerType: Story = {
  args: {
    children: <Button>Trigger Type</Button>,
    content: <div className="p-0">This popover uses the hover trigger type</div>,
    trigger: 'hover'
  }
};
