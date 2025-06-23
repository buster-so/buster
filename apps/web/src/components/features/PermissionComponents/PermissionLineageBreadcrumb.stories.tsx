import type { Meta, StoryObj } from '@storybook/react';
import type { DatasetPermissionOverviewUser } from '@/api/asset_interfaces';
import { PermissionLineageBreadcrumb } from './PermissionLineageBreadcrumb';

const meta: Meta<typeof PermissionLineageBreadcrumb> = {
  title: 'Features/Permissions/PermissionLineageBreadcrumb',
  component: PermissionLineageBreadcrumb,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  }
};

export default meta;
type Story = StoryObj<typeof PermissionLineageBreadcrumb>;

// Sample data for different scenarios
const singleLineage: DatasetPermissionOverviewUser['lineage'] = [
  [
    { type: 'user', name: 'John Doe', id: 'user1' },
    { type: 'datasets', name: 'Sales Dataset', id: 'dataset1' },
    { type: 'permissionGroups', name: 'Analysts', id: 'group1' }
  ]
];

const multipleLineage: DatasetPermissionOverviewUser['lineage'] = [
  [
    { type: 'user', name: 'John Doe', id: 'user1' },
    { type: 'datasets', name: 'Sales Dataset', id: 'dataset1' }
  ],
  [
    { type: 'user', name: 'John Doe', id: 'user1' },
    { type: 'datasetGroups', name: 'Marketing Data', id: 'datasetGroup1' }
  ]
];

const emptyLineage: DatasetPermissionOverviewUser['lineage'] = [];

export const SingleLineageCanQuery: Story = {
  args: {
    lineage: singleLineage,
    canQuery: true
  }
};

export const SingleLineageCannotQuery: Story = {
  args: {
    lineage: singleLineage,
    canQuery: false
  }
};

export const MultipleLineageCanQuery: Story = {
  args: {
    lineage: multipleLineage,
    canQuery: true
  }
};

export const MultipleLineageCannotQuery: Story = {
  args: {
    lineage: multipleLineage,
    canQuery: false
  }
};

export const NoLineage: Story = {
  args: {
    lineage: emptyLineage,
    canQuery: false
  }
};
