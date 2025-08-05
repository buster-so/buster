import type { Meta, StoryObj } from '@storybook/react';
import type { ShareAssetType, ShareConfig, ShareRole } from '@buster/server-shared/share';
import { ShareMenuContent } from './ShareMenuContent';

const meta: Meta<typeof ShareMenuContent> = {
  title: 'Features/ShareMenu/ShareMenuContent',
  component: ShareMenuContent,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof ShareMenuContent>;

const mockShareConfig: ShareConfig = {
  individual_permissions: [
    {
      email: 'test_with_a_long_name_like_super_long_name@test.com',
      role: 'can_view',
      name: 'Test User',
      avatar_url: null
    },
    {
      email: 'test2@test.com',
      role: 'full_access',
      name: 'Test User 2 with a long name like super long name',
      avatar_url: null
    }
  ],
  public_expiry_date: null,
  public_enabled_by: null,
  publicly_accessible: false,
  public_password: null,
  permission: 'owner',
  workspace_sharing: 'none',
  workspace_member_count: 20
};

export const MetricShare: Story = {
  args: {
    assetId: 'metric-123',
    assetType: 'metric',
    shareAssetConfig: mockShareConfig
  }
};

export const DashboardShare: Story = {
  args: {
    assetId: 'dashboard-456',
    assetType: 'dashboard',
    shareAssetConfig: mockShareConfig
  }
};

export const CollectionShare: Story = {
  args: {
    assetId: 'collection-789',
    assetType: 'collection',
    shareAssetConfig: mockShareConfig
  }
};

export const PubliclyAccessible: Story = {
  args: {
    assetId: 'metric-123',
    assetType: 'metric',
    shareAssetConfig: {
      ...mockShareConfig,
      publicly_accessible: true
    }
  }
};

export const ViewerPermission: Story = {
  args: {
    assetId: 'metric-123',
    assetType: 'metric',
    shareAssetConfig: {
      ...mockShareConfig,
      permission: 'can_view'
    }
  }
};

export const PublishedMetric: Story = {
  args: {
    assetId: 'metric-123',
    assetType: 'metric',
    shareAssetConfig: {
      ...mockShareConfig,
      publicly_accessible: true,
      public_expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      public_enabled_by: 'test@example.com'
    }
  }
};
