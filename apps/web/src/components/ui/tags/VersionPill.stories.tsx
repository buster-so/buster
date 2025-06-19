import type { Meta, StoryObj } from '@storybook/react';
import { VersionPill } from './VersionPill';

const meta: Meta<typeof VersionPill> = {
  title: 'UI/Tags/VersionPill',
  component: VersionPill,
  tags: ['autodocs'],
  argTypes: {
    version_number: {
      control: 'number',
      description: 'The version number to display in the pill',
      defaultValue: 1
    }
  }
};

export default meta;
type Story = StoryObj<typeof VersionPill>;

export const Default: Story = {
  args: {
    version_number: 12
  }
};
