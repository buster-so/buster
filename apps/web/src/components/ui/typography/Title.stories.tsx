import type { Meta, StoryObj } from '@storybook/react';
import { Title } from './Title';

const meta: Meta<typeof Title> = {
  title: 'UI/Typography/Title',
  component: Title,
  tags: ['autodocs'],
  args: {
    children: 'Sample Title'
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'tertiary', 'danger', 'primary', 'inherit', 'link']
    },
    size: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5']
    },
    as: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5']
    },
    truncate: {
      control: 'boolean',
      defaultValue: false
    }
  }
};

export default meta;

type Story = StoryObj<typeof Title>;

export const AllLevels: Story = {
  render: (args) => (
    <div className="flex flex-col gap-0">
      <Title size="h1" {...args}>
        Heading Level 1 (3xl - 24px)
      </Title>
      <Title size="h2" {...args}>
        Heading Level 2 (2xl - 20px)
      </Title>
      <Title size="h3" {...args}>
        Heading Level 3 (xl - 18px)
      </Title>
      <Title size="h4" {...args}>
        Heading Level 4 (lg - 16px)
      </Title>
      <Title size="h5" {...args}>
        Heading Level 5 (md - 14px)
      </Title>
    </div>
  )
};

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'h1'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'h1'
  }
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'h1'
  }
};

export const DifferentLevel: Story = {
  args: {
    variant: 'default',
    size: 'h3'
  }
};

export const CustomTag: Story = {
  args: {
    variant: 'default',
    size: 'h1',
    as: 'h2',
    children: 'H1 size but H2 tag'
  }
};

export const Truncated: Story = {
  args: {
    variant: 'default',
    size: 'h1',
    truncate: true,
    children:
      'This is a very long title that will be truncated when it exceeds the available space in the container'
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    )
  ]
};
