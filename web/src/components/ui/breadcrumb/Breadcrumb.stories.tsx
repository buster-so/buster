import { BusterRoutes } from '@/routes/busterRoutes';
import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from './Breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
  title: 'UI/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  }
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', route: { route: BusterRoutes.APP_HOME } },
      { label: 'Datasets', route: { route: BusterRoutes.APP_DATASETS } },
      { label: 'Current Dataset' }
    ]
  }
};

export const WithDropdown: Story = {
  args: {
    items: [
      { label: 'Home', route: { route: BusterRoutes.APP_HOME } },
      {
        label: null,
        dropdown: [
          { label: 'Dataset A', route: { route: BusterRoutes.APP_DATASETS } },
          { label: 'Dataset B', route: { route: BusterRoutes.APP_DATASETS } },
          { label: 'Dataset C', route: { route: BusterRoutes.APP_DATASETS } }
        ]
      },
      { label: 'Current Dataset' }
    ]
  }
};

export const CustomActiveIndex: Story = {
  args: {
    items: [
      { label: 'Home', route: { route: BusterRoutes.APP_HOME } },
      { label: 'Datasets', route: { route: BusterRoutes.APP_DATASETS } },
      { label: 'Settings', route: { route: BusterRoutes.SETTINGS_API_KEYS } },
      { label: 'Profile' }
    ],
    activeIndex: 2
  }
};

export const SingleItem: Story = {
  args: {
    items: [{ label: 'Home' }]
  }
};
