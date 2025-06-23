import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Text } from './Text';

const meta: Meta<typeof Text> = {
  title: 'UI/Typography/Text',
  component: Text,
  tags: ['autodocs'],
  args: {
    children: 'Sample Text'
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'tertiary', 'danger', 'primary', 'inherit', 'link']
    },
    size: {
      control: 'select',
      options: ['xxs', 'xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl']
    },
    truncate: {
      control: 'boolean',
      defaultValue: false
    }
  }
};

export default meta;

type Story = StoryObj<typeof Text>;

export const AllSizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-0">
      <Text size="4xl" {...args}>
        Text 4XL Size (30px)
      </Text>
      <Text size="3xl" {...args}>
        Text 3XL Size (24px)
      </Text>
      <Text size="2xl" {...args}>
        Text 2XL Size (20px)
      </Text>
      <Text size="xl" {...args}>
        Text XL Size (18px)
      </Text>
      <Text size="lg" {...args}>
        Text Large Size (16px)
      </Text>
      <Text size="sm" {...args}>
        Text Small Size (12px)
      </Text>
      <Text size="xs" {...args}>
        Text XS Size (11px)
      </Text>
      <Text size="2xs" {...args}>
        Text 2XS Size (8px)
      </Text>
      <Text size="3xs" {...args}>
        Text 3XS Size (6px)
      </Text>
    </div>
  )
};

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'base'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'base'
  }
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'base'
  }
};

export const Large: Story = {
  args: {
    variant: 'default',
    size: 'lg'
  }
};

export const Small: Story = {
  args: {
    variant: 'default',
    size: 'sm'
  }
};

export const Link: Story = {
  args: {
    variant: 'link',
    size: 'base',
    children: 'Click me'
  }
};

export const Truncated: Story = {
  args: {
    variant: 'default',
    size: 'base',
    truncate: true,
    children:
      'This is a very long text that will be truncated when it exceeds the available space in the container'
  },
  decorators: [
    (Story) => (
      <div className="overflow-hidden" style={{ width: '200px' }}>
        <Story />
      </div>
    )
  ]
};
