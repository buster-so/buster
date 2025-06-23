import type { Meta, StoryObj } from '@storybook/react';
import { Mailbox, MapSettings, User } from '../icons';
import { SearchDropdown } from './SearchDropdown';

const meta: Meta<typeof SearchDropdown> = {
  title: 'UI/Dropdowns/SearchDropdown',
  component: SearchDropdown,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    open: {
      control: 'boolean',
      defaultValue: true
    }
  },
  tags: ['autodocs'],
  render: (args) => (
    <div className="flex min-w-[500px] flex-col gap-0">
      <SearchDropdown {...args} children={<div className="h-6 w-full bg-gray-300"></div>} />
    </div>
  )
};

export default meta;
type Story = StoryObj<typeof SearchDropdown>;

const items = [
  {
    label: 'Nate Rules',
    value: 'profile',
    icon: <User />
  },
  {
    label: 'Settings',
    value: 'settings',
    icon: <MapSettings />
  },
  {
    label: 'Messages',
    value: 'messages',
    icon: <Mailbox />,
    disabled: false
  }
];

// Basic example
export const Default: Story = {
  args: {
    items: items,
    open: true,
    onSelect: (item) => alert(`Selected: ${item.value}`)
  }
};

// Example with some items disabled
export const WithDisabledItems: Story = {
  args: {
    items: [
      ...items,
      {
        label: 'Disabled Option',
        value: 'disabled',
        disabled: true
      }
    ],
    open: true,
    onSelect: (item) => alert(`Selected: ${item.value}`)
  }
};

// Example with custom styling
export const CustomStyling: Story = {
  args: {
    items: items,
    open: true,
    className: 'bg-slate-100 rounded-lg shadow-lg',
    onSelect: (item) => alert(`Selected: ${item.value}`)
  }
};
