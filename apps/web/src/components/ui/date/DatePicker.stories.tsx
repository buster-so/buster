import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DatePicker } from './DatePicker';

const meta: Meta<typeof DatePicker> = {
  title: 'UI/Date/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  argTypes: {
    dateFormat: {
      control: 'text',
      description: 'Format for displaying the selected date'
    },
    placeholder: {
      control: 'text',
      description: 'Text to display when no date is selected'
    },
    selected: {
      control: 'date',
      description: 'The currently selected date'
    },
    onSelect: {
      action: 'date selected',
      description: 'Callback when a date is selected'
    },
    mode: {
      control: 'select',
      options: ['single', 'range', 'multiple'],
      description: 'Selection mode for the calendar'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the date picker is disabled'
    },
    fromDate: {
      control: 'date',
      description: 'Minimum selectable date'
    },
    toDate: {
      control: 'date',
      description: 'Maximum selectable date'
    }
  }
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

// Create interactive wrappers for each story
const InteractiveDatePicker = ({ initialDate, ...args }: any) => {
  const [date, setDate] = useState<Date | undefined>(initialDate);

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    action('onSelect')(newDate);
  };

  return <DatePicker {...args} selected={date} onSelect={handleDateSelect} />;
};

export const Default: Story = {
  render: (args) => <InteractiveDatePicker {...args} initialDate={undefined} />,
  args: {
    placeholder: 'Select a date'
  }
};

export const WithSelectedDate: Story = {
  render: (args) => <InteractiveDatePicker {...args} initialDate={new Date()} />,
  args: {
    placeholder: 'Select a date'
  }
};

export const CustomDateFormat: Story = {
  render: (args) => <InteractiveDatePicker {...args} initialDate={new Date()} />,
  args: {
    dateFormat: 'MMMM dd, yyyy',
    placeholder: 'Select a date'
  }
};

export const Disabled: Story = {
  render: (args) => <InteractiveDatePicker {...args} initialDate={new Date()} />,
  args: {
    disabled: true,
    placeholder: 'Date selection disabled'
  }
};

export const WithDateRange: Story = {
  render: (args) => <InteractiveDatePicker {...args} initialDate={undefined} />,
  args: {
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    toDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    placeholder: 'Select within 30 day range'
  }
};
