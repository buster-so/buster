import type { Meta, StoryObj } from '@storybook/react-vite';
import { HttpResponse, http } from 'msw';
import { fn } from 'storybook/test';
import type { BusterMetricListItem } from '@/api/asset_interfaces';
import { BASE_URL } from '@/api/config';
import { generateMockDashboard } from '@/mocks/MOCK_DASHBOARD';
import { createMockListMetric } from '@/mocks/metric';
import { AddToDashboardModal } from './AddToDashboardModal';

const mockMetrics: BusterMetricListItem[] = Array.from({ length: 100 }, (_, index) =>
  createMockListMetric(`${index + 1}`)
);

const { response } = generateMockDashboard(3, 'dashboard-1');

const meta = {
  title: 'Features/Modal/AddToDashboardModal',
  component: AddToDashboardModal,
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [
        http.get(`${BASE_URL}/dashboards/dashboard-1`, () => {
          return HttpResponse.json(response);
        }),
        http.get(`${BASE_URL}/metrics?page_token=0&page_size=3000`, () => {
          return HttpResponse.json(mockMetrics);
        }),
      ],
    },
  },
} satisfies Meta<typeof AddToDashboardModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    onClose: fn(),
    dashboardId: 'dashboard-1',
    dashboardVersionNumber: 1,
  },
};

export const EmptyState: Story = {
  args: {
    open: true,
    onClose: fn(),
    dashboardId: 'dashboard-1',
    dashboardVersionNumber: undefined,
  },
};
