import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';
import { BusterRoutes } from '../../../routes';
import { HouseModern, MapSettings, User } from '../icons/NucleoIconOutlined';
import { SidebarCollapsible } from './SidebarCollapsible';

const meta: Meta<typeof SidebarCollapsible> = {
  title: 'UI/Sidebar/SidebarCollapsible',
  component: SidebarCollapsible,
  parameters: {
    layout: 'centered'
  },
  decorators: [
    (Story) => (
      <div className="bg-background min-w-[270px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof SidebarCollapsible>;

export const Default: Story = {
  args: {
    label: 'Settings',
    items: [
      {
        id: '1',
        label: 'Profile',
        icon: <User />,
        route: BusterRoutes.SETTINGS
      },
      {
        id: '2',
        label: 'Account',
        icon: <MapSettings />,
        route: BusterRoutes.APP_CHAT
      },
      {
        id: '3',
        label: 'Dashboard',
        icon: <HouseModern />,
        route: BusterRoutes.APP_METRIC
      }
    ]
  }
};

export const Sortable: Story = {
  args: {
    label: 'Sortable',
    isSortable: true,
    items: Default.args!.items!,
    onItemsReorder: fn()
  }
};
