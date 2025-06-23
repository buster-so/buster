import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ArrowUp, ShapeSquare } from '../icons/NucleoIconFilled';
import { InputTextAreaButton } from './InputTextAreaButton';

const meta: Meta<typeof InputTextAreaButton> = {
  title: 'UI/Inputs/InputTextAreaButton',
  component: InputTextAreaButton,
  tags: ['autodocs'],
  args: {},
  argTypes: {
    disabled: {
      control: 'boolean'
    },
    placeholder: {
      control: 'text'
    },
    rows: {
      control: 'number'
    },
    className: {
      control: 'text'
    }
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof InputTextAreaButton>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text here...',
    rows: 4
  }
};

export const WithAutoResize: Story = {
  args: {
    placeholder: 'Type to see auto-resize in action...',
    autoResize: {
      minRows: 3,
      maxRows: 6
    }
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled textarea',
    value: 'Cannot edit this text',
    rows: 4
  }
};

export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'Type your message here...',
    rows: 3
  }
};

export const WithInitialValue: Story = {
  args: {
    value: 'This is some initial text in the textarea...',
    rows: 4
  }
};

export const ChatInput: Story = {
  args: {
    placeholder: 'Ask Buster a question...',
    rows: 4,
    autoResize: {
      minRows: 4,
      maxRows: 12
    },

    loadingIcon: <ShapeSquare />,
    sendIcon: <ArrowUp />,
    onStop: fn(),
    onSubmit: fn()
  }
};
