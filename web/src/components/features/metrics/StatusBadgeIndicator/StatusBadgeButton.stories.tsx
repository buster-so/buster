import { VerificationStatus } from '@/api/asset_interfaces';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { StatusBadgeButton } from './StatusBadgeButton';

const meta = {
  title: 'Features/Metrics/StatusBadgeButton',
  component: StatusBadgeButton,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  args: {
    status: VerificationStatus.NOT_REQUESTED,
    id: 'metric-123',
    isAdmin: false,
    onVerify: fn(),
    disabled: false
  },
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(VerificationStatus),
      description: 'The verification status of the badge'
    },
    id: {
      control: 'text',
      description: 'The ID of the metric or an array of metric IDs'
    },
    isAdmin: {
      control: 'boolean',
      description: 'Whether the user is an admin and can change all statuses',
      defaultValue: false
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
      defaultValue: false
    },
    onVerify: {
      description: 'Function called when verification status is changed'
    }
  },
  decorators: [
    (Story) => (
      <div className="p-5">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof StatusBadgeButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic StatusBadgeButton examples for each status
export const NotRequested: Story = {
  args: {
    status: VerificationStatus.NOT_REQUESTED
  }
};

export const Requested: Story = {
  args: {
    status: VerificationStatus.REQUESTED
  }
};

export const InReview: Story = {
  args: {
    status: VerificationStatus.IN_REVIEW
  }
};

export const Verified: Story = {
  args: {
    status: VerificationStatus.VERIFIED
  }
};

export const Backlogged: Story = {
  args: {
    status: VerificationStatus.BACKLOGGED
  }
};

export const NotVerified: Story = {
  args: {
    status: VerificationStatus.NOT_VERIFIED
  }
};

// Admin user can change all statuses
export const AdminUser: Story = {
  args: {
    status: VerificationStatus.NOT_REQUESTED,
    isAdmin: true
  }
};

// Disabled button
export const DisabledButton: Story = {
  args: {
    status: VerificationStatus.NOT_REQUESTED,
    disabled: true
  }
};

// Multiple IDs (shows "Status" text)
export const MultipleIds: Story = {
  args: {
    status: VerificationStatus.NOT_REQUESTED,
    id: ['metric-123', 'metric-456', 'metric-789']
  }
};

// Verified status (non-admin can't change)
export const VerifiedNonAdmin: Story = {
  args: {
    status: VerificationStatus.VERIFIED,
    isAdmin: false
  }
};

// Admin with verified status (can change)
export const VerifiedAdmin: Story = {
  args: {
    status: VerificationStatus.VERIFIED,
    isAdmin: true
  }
};
