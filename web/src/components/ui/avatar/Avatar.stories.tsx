import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta = {
  title: 'UI/Avatar/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    name: 'John Doe'
  }
};

export const WithImage: Story = {
  args: {
    name: 'John Doe',
    image: faker.image.avatar()
  }
};

export const WithImageAndNoName: Story = {
  args: {
    image: faker.image.avatar()
  }
};

export const WithTooltip: Story = {
  args: {
    name: 'John Doe',
    useToolTip: true
  }
};

export const CustomClassName: Story = {
  args: {
    name: 'John Doe',
    className: 'h-12 w-12'
  }
};

export const SingleLetter: Story = {
  args: {
    name: 'John'
  }
};

export const NoName: Story = {
  args: {}
};

export const ProblematicLeadingCharacter: Story = {
  args: {
    name: 'jared yes @'
  }
};

export const WithEmail: Story = {
  args: {
    name: 'jared@yes.com'
  }
};
