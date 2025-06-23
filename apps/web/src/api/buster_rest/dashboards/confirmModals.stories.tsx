import type { Meta, StoryObj } from '@storybook/react';
import { createDashboardFullConfirmModal } from './confirmModals';

const meta: Meta<typeof createDashboardFullConfirmModal> = {
  title: 'Features/Dashboards/DashboardFullConfirmModal',
  component: createDashboardFullConfirmModal,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof createDashboardFullConfirmModal>;

const sampleMetrics = [
  { id: '1', name: 'CPU Usage' },
  { id: '2', name: 'Memory Usage' },
  { id: '3', name: 'Network Traffic' },
  { id: '4', name: 'Disk I/O' },
  { id: '5', name: 'Error Rate' }
];

export const Default: Story = {
  args: {
    availableSlots: 3,
    metricsToActuallyAdd: sampleMetrics.slice(0, 3),
    metricsToAdd: sampleMetrics
  }
};
