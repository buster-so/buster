import type { ListShortcutsResponse } from '@buster/server-shared/shortcuts';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';
import { getQueryClient } from '@/integrations/tanstack-query/query-client';
import { BusterChatInputBase } from './BusterChatInputBase';

const DEFAULT_USER_SUGGESTED_PROMPTS = {
  suggestedPrompts: {
    report: [
      'provide a trend analysis of quarterly profits',
      'evaluate product performance across regions',
    ],
    dashboard: ['create a sales performance dashboard', 'design a revenue forecast dashboard'],
    visualization: ['create a metric for monthly sales', 'show top vendors by purchase volume'],
    help: [
      'what types of analyses can you perform?',
      'what questions can I as buster?',
      'what data models are available for queries?',
      'can you explain your forecasting capabilities?',
    ],
  },
  updatedAt: new Date().toISOString(),
};

const meta: Meta<typeof BusterChatInputBase> = {
  title: 'Features/Input/BusterChatInputBase',
  component: BusterChatInputBase,
  decorators: [
    (Story) => (
      <QueryClientProvider client={getQueryClient()}>
        <div style={{ width: '600px', minHeight: '400px', padding: '20px' }}>
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Chat input component with intelligent suggestions and shortcuts for Buster chat interface. Displays 4 unique random suggestions from suggested prompts plus available shortcuts.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof BusterChatInputBase>;

// Mock shortcuts data
const mockShortcuts: ListShortcutsResponse['shortcuts'] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'weekly-sales-report',
    instructions: 'Generate a comprehensive weekly sales report with key metrics and trends',
    createdBy: '123e4567-e89b-12d3-a456-426614174001',
    updatedBy: null,
    organizationId: '123e4567-e89b-12d3-a456-426614174002',
    shareWithWorkspace: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    name: 'customer-analysis',
    instructions: 'Analyze customer behavior patterns and provide insights',
    createdBy: '123e4567-e89b-12d3-a456-426614174001',
    updatedBy: null,
    organizationId: '123e4567-e89b-12d3-a456-426614174002',
    shareWithWorkspace: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    name: 'revenue-forecast',
    instructions: 'Create a revenue forecast for the next quarter based on current trends',
    createdBy: '123e4567-e89b-12d3-a456-426614174001',
    updatedBy: null,
    organizationId: '123e4567-e89b-12d3-a456-426614174002',
    shareWithWorkspace: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174005',
    name: 'customer-support-wow',
    instructions: 'Provide customer support for the next quarter based on current trends',
    createdBy: '123e4567-e89b-12d3-a456-426614174001',
    updatedBy: null,
    organizationId: '123e4567-e89b-12d3-a456-426614174002',
    shareWithWorkspace: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174006',
    name: 'who-is-the-best-player-in-the-nba',
    instructions: 'Provide customer support for the next quarter based on current trends',
    createdBy: '123e4567-e89b-12d3-a456-426614174001',
    updatedBy: null,
    organizationId: '123e4567-e89b-12d3-a456-426614174002',
    shareWithWorkspace: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  },
];

export const Default: Story = {
  args: {
    defaultValue: '',
    onSubmit: fn(),
    onStop: fn(),
    submitting: false,
    disabled: false,
    shortcuts: mockShortcuts,
    suggestedPrompts: DEFAULT_USER_SUGGESTED_PROMPTS.suggestedPrompts,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default chat input with suggestions from multiple categories (report, dashboard, visualization, help) and shortcuts. Shows 4 unique random suggestions plus available shortcuts with a separator.',
      },
    },
  },
};

export const WithPrefilledText: Story = {
  args: {
    defaultValue: 'Generate a comprehensive sales report with quarterly trends',
    onSubmit: fn(),
    onStop: fn(),
    submitting: false,
    disabled: false,
    shortcuts: mockShortcuts,
    suggestedPrompts: DEFAULT_USER_SUGGESTED_PROMPTS.suggestedPrompts,
  },
  parameters: {
    docs: {
      description: {
        story: 'Chat input with pre-filled text to show how default values are handled.',
      },
    },
  },
};

export const Submitting: Story = {
  args: {
    defaultValue: 'Generate a sales report for Q4',
    onSubmit: fn(),
    onStop: fn(),
    submitting: true,
    disabled: false,
    shortcuts: mockShortcuts,
    suggestedPrompts: DEFAULT_USER_SUGGESTED_PROMPTS.suggestedPrompts,
  },
  parameters: {
    docs: {
      description: {
        story: 'Chat input in submitting state - shows the state when a query is being processed.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: 'This input is disabled',
    onSubmit: fn(),
    onStop: fn(),
    submitting: false,
    disabled: true,
    shortcuts: mockShortcuts,
    suggestedPrompts: DEFAULT_USER_SUGGESTED_PROMPTS.suggestedPrompts,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled chat input state.',
      },
    },
  },
};

export const NoShortcuts: Story = {
  args: {
    defaultValue: '',
    onSubmit: fn(),
    onStop: fn(),
    submitting: false,
    disabled: false,
    shortcuts: [],
    suggestedPrompts: DEFAULT_USER_SUGGESTED_PROMPTS.suggestedPrompts,
  },
  parameters: {
    docs: {
      description: {
        story: 'Chat input with only suggested prompts, no shortcuts available.',
      },
    },
  },
};
