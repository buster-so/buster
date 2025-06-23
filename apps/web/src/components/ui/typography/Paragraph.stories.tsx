import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import Paragraph from './Paragraph';

const meta = {
  title: 'UI/Typography/Paragraph',
  component: Paragraph,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'tertiary', 'danger'],
      description: 'The color variant of the text'
    },
    size: {
      control: 'select',
      options: ['base', 'sm', 'xs', 'md', 'lg'],
      description: 'The size of the text'
    },
    lineHeight: {
      control: 'select',
      options: ['none', 'sm', 'base', 'md', 'lg'],
      description: 'The line height of the text'
    },
    children: {
      control: 'text',
      description: 'The content of the paragraph'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  },
  decorators: [
    (Story) => (
      <div className="flex max-w-[300px] flex-col gap-2 border p-2">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Paragraph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: faker.lorem.paragraphs(3),
    variant: 'default',
    size: 'base',
    lineHeight: 'base'
  }
};

export const Small: Story = {
  args: {
    children: faker.lorem.paragraph({ min: 1, max: 2 }),
    size: 'sm',
    variant: 'default',
    lineHeight: 'base'
  }
};

export const Primary: Story = {
  args: {
    children: faker.lorem.paragraphs(3),
    variant: 'primary',
    size: 'base',
    lineHeight: 'base'
  }
};

export const Secondary: Story = {
  args: {
    children: faker.lorem.paragraphs(3),
    variant: 'secondary',
    size: 'base',
    lineHeight: 'base'
  }
};

export const Large: Story = {
  args: {
    children: faker.lorem.paragraphs(3),
    size: 'lg',
    variant: 'default',
    lineHeight: 'lg'
  }
};

export const Danger: Story = {
  args: {
    children: faker.lorem.paragraphs(3),
    variant: 'danger',
    size: 'base',
    lineHeight: 'base'
  }
};

export const CustomLineHeight: Story = {
  args: {
    children: faker.lorem.paragraphs(3),
    variant: 'default',
    size: 'base',
    lineHeight: 'lg'
  }
};
