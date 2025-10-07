import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { action } from 'storybook/actions';
import { DateRangePicker } from './DateRangePicker';

const meta: Meta<typeof DateRangePicker> = {
  title: 'UI/Date/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
  argTypes: {
    initialDateFrom: {
      control: 'date',
      description: 'Initial value for start date',
    },
    initialDateTo: {
      control: 'date',
      description: 'Initial value for end date',
    },
    initialCompareFrom: {
      control: 'date',
      description: 'Initial value for start date for compare',
    },
    initialCompareTo: {
      control: 'date',
      description: 'Initial value for end date for compare',
    },
    onUpdate: {
      action: 'range updated',
      description: 'Click handler for applying the updates from DateRangePicker',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end'],
      description: 'Alignment of popover',
    },
    locale: {
      control: 'text',
      description: 'Option for locale',
    },
    showCompare: {
      control: 'boolean',
      description: 'Option for showing compare feature',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

const InteractiveDateRangePicker = ({ onUpdate, ...args }: any) => {
  const handleUpdate = (values: any) => {
    action('onUpdate')(values);
    onUpdate?.(values);
  };

  return <DateRangePicker {...args} onUpdate={handleUpdate} />;
};

export const Default: Story = {
  render: (args) => <InteractiveDateRangePicker {...args} />,
  args: {
    align: 'end',
    locale: 'en-US',
    showCompare: true,
  },
};

export const Last7Days: Story = {
  render: (args) => <InteractiveDateRangePicker {...args} />,
  args: {
    initialDateFrom: new Date(new Date().setDate(new Date().getDate() - 6)),
    initialDateTo: new Date(),
    align: 'end',
    locale: 'en-US',
    showCompare: true,
  },
};

export const Last30Days: Story = {
  render: (args) => <InteractiveDateRangePicker {...args} />,
  args: {
    initialDateFrom: new Date(new Date().setDate(new Date().getDate() - 29)),
    initialDateTo: new Date(),
    align: 'end',
    locale: 'en-US',
    showCompare: true,
  },
};

export const WithComparison: Story = {
  render: (args) => <InteractiveDateRangePicker {...args} />,
  args: {
    initialDateFrom: new Date(new Date().setDate(new Date().getDate() - 6)),
    initialDateTo: new Date(),
    initialCompareFrom: new Date(new Date().setDate(new Date().getDate() - 13)),
    initialCompareTo: new Date(new Date().setDate(new Date().getDate() - 7)),
    align: 'end',
    locale: 'en-US',
    showCompare: true,
  },
};

export const WithoutCompare: Story = {
  render: (args) => <InteractiveDateRangePicker {...args} />,
  args: {
    initialDateFrom: new Date(new Date().setDate(new Date().getDate() - 6)),
    initialDateTo: new Date(),
    align: 'end',
    locale: 'en-US',
    showCompare: false,
  },
};

export const CustomLocale: Story = {
  render: (args) => <InteractiveDateRangePicker {...args} />,
  args: {
    initialDateFrom: new Date(new Date().setDate(new Date().getDate() - 6)),
    initialDateTo: new Date(),
    align: 'end',
    locale: 'de-DE',
    showCompare: true,
  },
};

export const AlignStart: Story = {
  render: (args) => <InteractiveDateRangePicker {...args} />,
  args: {
    initialDateFrom: new Date(new Date().setDate(new Date().getDate() - 6)),
    initialDateTo: new Date(),
    align: 'start',
    locale: 'en-US',
    showCompare: true,
  },
};

export const CurrentMonth: Story = {
  render: (args) => <InteractiveDateRangePicker {...args} />,
  args: {
    initialDateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    initialDateTo: new Date(),
    align: 'end',
    locale: 'en-US',
    showCompare: true,
  },
};
