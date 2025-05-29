import { type BusterShare, ShareAssetType, ShareRole } from '@/api/asset_interfaces';
import type { Meta, StoryObj } from '@storybook/react';
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

const mockShareConfig: BusterShare = {
  individual_permissions: [
    {
      email: 'test_with_a_long_name_like_super_long_name@test.com',
      role: ShareRole.CAN_VIEW,
      name: 'Test User'
    },
    {
      email: 'test2@test.com',
      role: ShareRole.FULL_ACCESS,
      name: 'Test User 2 with a long name like super long name'
    }
  ],
  public_expiry_date: null,
  public_enabled_by: null,
  publicly_accessible: false,
  public_password: null,
  permission: ShareRole.OWNER
};

export const MetricShare: Story = {
  args: {
    assetId: 'metric-123',
    assetType: ShareAssetType.METRIC,
    shareAssetConfig: mockShareConfig
  }
};

export const DashboardShare: Story = {
  args: {
    assetId: 'dashboard-456',
    assetType: ShareAssetType.DASHBOARD,
    shareAssetConfig: mockShareConfig
  }
};

export const CollectionShare: Story = {
  args: {
    assetId: 'collection-789',
    assetType: ShareAssetType.COLLECTION,
    shareAssetConfig: mockShareConfig
  }
};

export const PubliclyAccessible: Story = {
  args: {
    assetId: 'metric-123',
    assetType: ShareAssetType.METRIC,
    shareAssetConfig: {
      ...mockShareConfig,
      publicly_accessible: true
    }
  }
};

export const ViewerPermission: Story = {
  args: {
    assetId: 'metric-123',
    assetType: ShareAssetType.METRIC,
    shareAssetConfig: {
      ...mockShareConfig,
      permission: ShareRole.CAN_VIEW
    }
  }
};

export const PublishedMetric: Story = {
  args: {
    assetId: 'metric-123',
    assetType: ShareAssetType.METRIC,
    shareAssetConfig: {
      ...mockShareConfig,
      publicly_accessible: true,
      public_expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      public_enabled_by: 'test@example.com'
    }
  }
};
