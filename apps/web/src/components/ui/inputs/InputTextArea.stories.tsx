import type { Meta, StoryObj } from '@storybook/react';
import { InputTextArea } from './InputTextArea';

const meta: Meta<typeof InputTextArea> = {
  title: 'UI/Inputs/InputTextArea',
  component: InputTextArea,
  tags: ['autodocs'],
  args: {
    autoResize: {
      minRows: 1,
      maxRows: 4
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'ghost']
    },
    disabled: {
      control: 'boolean'
    },
    placeholder: {
      control: 'text'
    },
    rows: {
      control: 'number'
    }
  }
};

export default meta;
type Story = StoryObj<typeof InputTextArea>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text here...',
    rows: 4
  }
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    placeholder: 'Ghost textarea...',
    rows: 4
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

export const LargeRows: Story = {
  args: {
    placeholder: 'Large textarea...',
    rows: 8
  }
};

export const AutoResize: Story = {
  args: {
    placeholder: 'Auto resize textarea...',
    autoResize: {
      minRows: 4,
      maxRows: 12
    }
  }
};
