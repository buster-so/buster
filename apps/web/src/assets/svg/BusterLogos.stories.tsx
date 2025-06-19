import type { Meta, StoryObj } from '@storybook/react';
import { BusterLogo } from './BusterLogo';
import { BusterLogoWithText } from './BusterLogoWithText';

const meta: Meta<typeof BusterLogo> = {
  title: 'UI/Logos',
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' }
  }
};

export default meta;
type Story = StoryObj<typeof BusterLogo>;

export const DefaultBusterLogo: Story = {
  render: (args) => <BusterLogo {...args} />
};

type BusterLogoNewStory = StoryObj<typeof BusterLogoWithText>;

export const DefaultBusterLogoWithText: BusterLogoNewStory = {
  render: (args) => <BusterLogoWithText {...args} />,
  args: {
    color: 'currentColor'
  }
};

export const CustomColorBusterLogoWithText: BusterLogoNewStory = {
  render: (args) => <BusterLogoWithText {...args} />,
  args: {
    color: '#FF0000'
  }
};
