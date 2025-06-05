import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ShareAssetType } from '../../../api/asset_interfaces/share';
import { BusterRoutes, createBusterRoute } from '../../../routes';
import { SidebarPrimary } from './SidebarPrimary';

const meta: Meta<typeof SidebarPrimary> = {
  title: 'Features/Sidebars/SidebarPrimary',
  component: SidebarPrimary,
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    (Story) => (
      <div className="bg-background-secondary h-screen w-[300px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof SidebarPrimary>;

const mockFavorites = [
  {
    id: '123',
    name: 'Favorite Dashboard',
    ype: ShareAssetType.DASHBOARD,
    asset_id: '123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    route: createBusterRoute({ route: BusterRoutes.APP_DASHBOARD_ID, dashboardId: '123' })
  },
  {
    id: '456',
    name: 'Important Metrics',
    route: createBusterRoute({ route: BusterRoutes.APP_METRIC_ID_CHART, metricId: '456' }),
    ype: ShareAssetType.METRIC,
    asset_id: '456',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '789',
    name: 'Favorite Metric 3',
    route: createBusterRoute({ route: BusterRoutes.APP_METRIC_ID_CHART, metricId: '789' }),
    ype: ShareAssetType.METRIC,
    asset_id: '789',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const AdminUser: Story = {
  args: {
    isAdmin: true,
    activePage: 'home',
    favorites: mockFavorites,
    onClickInvitePeople: () => alert('Invite people clicked'),
    onClickLeaveFeedback: () => alert('Leave feedback clicked')
  }
};

export const RegularUser: Story = {
  args: {
    isAdmin: false,
    activePage: 'home',
    favorites: mockFavorites,
    onClickInvitePeople: () => alert('Invite people clicked'),
    onClickLeaveFeedback: () => alert('Leave feedback clicked')
  }
};

export const NoFavorites: Story = {
  args: {
    isAdmin: true,
    activePage: 'home',
    favorites: null,
    onClickInvitePeople: () => alert('Invite people clicked'),
    onClickLeaveFeedback: () => alert('Leave feedback clicked')
  }
};

export const DifferentActiveRoute: Story = {
  args: {
    isAdmin: true,

    activePage: 'chat',
    favorites: mockFavorites,
    onClickInvitePeople: () => alert('Invite people clicked'),
    onClickLeaveFeedback: () => alert('Leave feedback clicked')
  }
};

export const FavoritesActiveRoute: Story = {
  args: {
    isAdmin: true,
    favorites: mockFavorites,
    activePage: createBusterRoute({ route: BusterRoutes.APP_METRIC_ID_CHART, metricId: '456' })
  }
};
