import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat/chatMessageInterfaces';
import { ChatResponseMessage_DashboardFile } from './ChatResponseMessage_DashboardFile';
import { BASE_URL } from '@/api/buster_rest/config';
import { generateMockDashboard } from '@/mocks/MOCK_DASHBOARD';

const mockResponseMessage: BusterChatResponseMessage_file = {
  id: 'dashboard-response-1',
  type: 'file',
  file_type: 'dashboard',
  file_name: 'Sales Dashboard',
  version_number: 1,
  filter_version_id: null,
  metadata: [
    {
      status: 'completed',
      message: 'Dashboard loaded successfully',
      timestamp: Date.now()
    }
  ]
};

const { response: mockDashboardResponse } = generateMockDashboard(
  3, // numMetrics
  'dashboard-response-1' // dashboardId
);

const meta: Meta<typeof ChatResponseMessage_DashboardFile> = {
  title: 'UI/layouts/ChatResponseMessage_DashboardFile',
  component: ChatResponseMessage_DashboardFile,
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        http.get(`${BASE_URL}/dashboards/dashboard-response-1`, ({ request }) => {
          const url = new URL(request.url);
          const versionNumber = url.searchParams.get('version_number');

          // You can handle different logic based on version_number if needed
          // For now, returning the same mock response regardless of version
          return HttpResponse.json(mockDashboardResponse);
        })
      ]
    }
  },
  tags: ['autodocs'],
  argTypes: {
    isCompletedStream: {
      control: 'boolean',
      description: 'Whether the stream has completed'
    },
    responseMessage: {
      control: false,
      description: 'The dashboard file response message'
    },
    isSelectedFile: {
      control: 'boolean',
      description: 'Whether this file is currently selected'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isCompletedStream: true,
    responseMessage: mockResponseMessage,
    isSelectedFile: false
  }
};

export const Selected: Story = {
  args: {
    isCompletedStream: true,
    responseMessage: mockResponseMessage,
    isSelectedFile: true
  }
};

export const StreamingInProgress: Story = {
  args: {
    isCompletedStream: false,
    responseMessage: mockResponseMessage,
    isSelectedFile: false
  }
};

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${BASE_URL}/dashboards/dashboard-response-1`, async ({ request }) => {
          const url = new URL(request.url);
          const versionNumber = url.searchParams.get('version_number');

          // Delay response to show loading state
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return HttpResponse.json(mockDashboardResponse);
        })
      ]
    }
  },
  args: {
    isCompletedStream: true,
    responseMessage: mockResponseMessage,
    isSelectedFile: false
  }
};

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${BASE_URL}/dashboards/dashboard-response-1`, ({ request }) => {
          const url = new URL(request.url);
          const versionNumber = url.searchParams.get('version_number');

          return HttpResponse.json({ error: 'Dashboard not found' }, { status: 404 });
        })
      ]
    }
  },
  args: {
    isCompletedStream: true,
    responseMessage: mockResponseMessage,
    isSelectedFile: false
  }
};

export const DifferentVersions: Story = {
  args: {
    isCompletedStream: true,
    responseMessage: {
      ...mockResponseMessage,
      version_number: 3,
      file_name: 'Marketing Dashboard v3'
    },
    isSelectedFile: false
  }
};

export const WithMetadata: Story = {
  args: {
    isCompletedStream: true,
    responseMessage: {
      ...mockResponseMessage,
      metadata: [
        {
          status: 'loading',
          message: 'Loading dashboard data...',
          timestamp: Date.now() - 3000
        },
        {
          status: 'completed',
          message: 'Dashboard loaded successfully',
          timestamp: Date.now()
        }
      ]
    },
    isSelectedFile: false
  }
};
