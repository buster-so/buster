import type { Meta, StoryObj } from '@storybook/react';
import { DataSourceTypes } from '@/api/asset_interfaces/datasources';
import { AppDataSourceIcon } from './AppDataSourceIcons';

const meta: Meta<typeof AppDataSourceIcon> = {
  title: 'UI/Icons/DataSourceIcon',
  component: AppDataSourceIcon,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: Object.values(DataSourceTypes),
      description: 'The type of data source to display'
    },
    size: {
      control: 'number',
      description: 'Size of the icon in pixels'
    },
    onClick: {
      description: 'Optional click handler'
    },
    className: {
      description: 'Optional CSS class name'
    }
  }
};

export default meta;
type Story = StoryObj<typeof AppDataSourceIcon>;

// Base story showing all data source icons
export const AllDataSourceIcons: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 p-4">
      {Object.values(DataSourceTypes).map((type) => (
        <div key={type} className="flex flex-col items-center gap-2">
          <AppDataSourceIcon type={type} size={32} />
          <span className="text-sm">{type}</span>
        </div>
      ))}
    </div>
  )
};

// Individual icon stories
export const PostgresIcon: Story = {
  args: {
    type: DataSourceTypes.postgres,
    size: 32
  }
};

export const MySQLIcon: Story = {
  args: {
    type: DataSourceTypes.mysql,
    size: 32
  }
};

export const SnowflakeIcon: Story = {
  args: {
    type: DataSourceTypes.snowflake,
    size: 32
  }
};

export const BigQueryIcon: Story = {
  args: {
    type: DataSourceTypes.bigquery,
    size: 32
  }
};

// Interactive example with different sizes
export const InteractiveSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <AppDataSourceIcon type={DataSourceTypes.postgres} size={16} />
      <AppDataSourceIcon type={DataSourceTypes.postgres} size={24} />
      <AppDataSourceIcon type={DataSourceTypes.postgres} size={32} />
      <AppDataSourceIcon type={DataSourceTypes.postgres} size={48} />
    </div>
  )
};

// Clickable example
export const Clickable: Story = {
  args: {
    type: DataSourceTypes.postgres,
    size: 32,
    onClick: () => alert('Icon clicked!')
  }
};
