import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SidebarSettings } from './SidebarSettings';

const meta: Meta<typeof SidebarSettings> = {
  title: 'Features/Sidebars/SidebarSettings',
  component: SidebarSettings,
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    (Story) => (
      <div className="bg-background-secondary h-screen w-[300px]">
        <Story />
      </div>
    )
  ],
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof SidebarSettings>;

export const Default: Story = {
  args: {
    activePage: 'profile',
    isAdmin: true
  }
};

export const NonAdmin: Story = {
  args: {
    activePage: 'profile',
    isAdmin: false
  }
};
