import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { BusterOrganizationRole } from '@/api/asset_interfaces/organizations';
import { NewChatWarning } from './NewChatWarning';

const meta: Meta<typeof NewChatWarning> = {
  title: 'Controllers/HomePage/NewChatWarning',
  component: NewChatWarning,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A setup checklist component that guides users through connecting data sources and creating datasets before they can start chatting.'
      }
    }
  },
  argTypes: {
    hasDatasets: {
      control: 'boolean',
      description: 'Whether the user has created any datasets'
    },
    hasDatasources: {
      control: 'boolean',
      description: 'Whether the user has connected any data sources'
    },
    isAdmin: {
      control: 'boolean',
      description: 'Whether the user has admin privileges'
    },
    userRole: {
      control: 'select',
      options: Object.values(BusterOrganizationRole),
      description: "The user's role in the organization"
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default state - new admin user with nothing set up
export const NewUser: Story = {
  args: {
    hasDatasets: false,
    hasDatasources: false,
    isAdmin: true,
    userRole: BusterOrganizationRole.DATA_ADMIN
  }
};

// Complete setup - admin user has both datasets and datasources
export const CompleteSetup: Story = {
  args: {
    hasDatasets: true,
    hasDatasources: true,
    isAdmin: true,
    userRole: BusterOrganizationRole.DATA_ADMIN
  }
};

// Workspace admin with complete setup
export const WorkspaceAdminCompleteSetup: Story = {
  args: {
    hasDatasets: true,
    hasDatasources: true,
    isAdmin: true,
    userRole: BusterOrganizationRole.WORKSPACE_ADMIN
  }
};

// Non-admin users - show contact admin card
export const ViewerRole: Story = {
  args: {
    hasDatasets: false,
    hasDatasources: false,
    isAdmin: false,
    userRole: BusterOrganizationRole.VIEWER
  }
};

export const QuerierRole: Story = {
  args: {
    hasDatasets: false,
    hasDatasources: false,
    isAdmin: false,
    userRole: BusterOrganizationRole.QUERIER
  }
};

export const RestrictedQuerierRole: Story = {
  args: {
    hasDatasets: false,
    hasDatasources: false,
    isAdmin: false,
    userRole: BusterOrganizationRole.RESTRICTED_QUERIER
  }
};
