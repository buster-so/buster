import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';
import { EditableTitle } from './EditableTitle';

const meta: Meta<typeof EditableTitle> = {
  title: 'UI/Typography/EditableTitle',
  component: EditableTitle,
  argTypes: {
    children: {
      control: 'text',
      description: 'The text content of the title'
    },
    level: {
      control: { type: 'select', options: [1, 2, 3, 4, 5] },
      description: 'The heading level, affecting the font size'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the title is editable or not'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when the title is empty'
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names for the container'
    },
    inputClassName: {
      control: 'text',
      description: 'Additional CSS class names for the input element'
    }
  }
};

export default meta;
type Story = StoryObj<typeof EditableTitle>;

// Helper component to control editable state in Storybook
const EditableTitleContainer = (args: React.ComponentProps<typeof EditableTitle>) => {
  const [value, setValue] = React.useState(args.children);

  return (
    <EditableTitle
      {...args}
      children={value}
      onChange={(newValue) => {
        setValue(newValue);
        args.onChange?.(newValue);
      }}
    />
  );
};

export const Default: Story = {
  render: (args) => <EditableTitleContainer {...args} />,
  args: {
    children: 'Editable Title',
    level: 4,
    onChange: fn(),
    onEdit: fn(),
    placeholder: 'Enter a title'
  }
};

export const Level1: Story = {
  render: (args) => <EditableTitleContainer {...args} />,
  args: {
    children: 'Large Heading',
    level: 1,
    onChange: fn(),
    onEdit: fn()
  }
};

export const Level2: Story = {
  render: (args) => <EditableTitleContainer {...args} />,
  args: {
    children: 'Medium Heading',
    level: 2,
    onChange: fn(),
    onEdit: fn()
  }
};

export const Level3: Story = {
  render: (args) => <EditableTitleContainer {...args} />,
  args: {
    children: 'Small Heading',
    level: 3,
    onChange: fn(),
    onEdit: fn()
  }
};

export const Disabled: Story = {
  render: (args) => <EditableTitleContainer {...args} />,
  args: {
    children: 'Non-editable Title',
    level: 4,
    disabled: true,
    onChange: fn(),
    onEdit: fn()
  }
};

export const WithPlaceholder: Story = {
  render: (args) => <EditableTitleContainer {...args} />,
  args: {
    children: '',
    level: 4,
    placeholder: 'Enter your title here...',
    onChange: fn(),
    onEdit: fn()
  }
};

export const InitiallyEditing: Story = {
  render: (args) => <EditableTitleContainer {...args} />,
  args: {
    children: 'Initially in Edit Mode',
    level: 4,
    onChange: fn(),
    onEdit: fn()
  }
};
