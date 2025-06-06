import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Mailbox, MapSettings, User } from '../icons';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select/Select',
  component: Select,
  parameters: {
    layout: 'centered'
  },
  args: {
    onChange: fn()
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Select>;

const basicItems = [
  { value: 'apples', label: 'Apples' },
  { value: 'bananas', label: 'Bananas' },
  { value: 'cherries', label: 'Cherries' }
];

const itemsWithIcons = [
  { value: 'profile', label: 'Profile', icon: <User /> },
  { value: 'settings', label: 'Settings', icon: <MapSettings /> },
  { value: 'messages', label: 'Messages', icon: <Mailbox /> }
];

const groupedItems = [
  {
    label: 'Fruits',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' }
    ]
  },
  {
    label: 'Vegetables',
    items: [
      { value: 'carrot', label: 'Carrot' },
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'spinach', label: 'Spinach' }
    ]
  }
];

const itemsWithSecondaryLabel = [
  { value: 'user1', label: 'John Doe', secondaryLabel: 'Admin' },
  { value: 'user2', label: 'Jane Smith', secondaryLabel: 'Editor' },
  { value: 'user3', label: 'Bob Johnson', secondaryLabel: 'Viewer', disabled: true }
];

const itemsWithSomeDisabled = [
  { value: 'active1', label: 'Available Option 1' },
  { value: 'disabled1', label: 'Unavailable Option 1', disabled: true },
  { value: 'active2', label: 'Available Option 2' },
  { value: 'disabled2', label: 'Unavailable Option 2', disabled: true },
  { value: 'active3', label: 'Available Option 3' }
];

export const Basic: Story = {
  args: {
    items: basicItems,
    placeholder: 'Select an option'
  }
};

export const WithIcons: Story = {
  args: {
    items: itemsWithIcons,
    placeholder: 'Select an option'
  }
};

export const Grouped: Story = {
  args: {
    items: groupedItems,
    placeholder: 'Select an option'
  }
};

export const WithSecondaryLabels: Story = {
  args: {
    items: itemsWithSecondaryLabel,
    placeholder: 'Select a user'
  }
};

export const Disabled: Story = {
  args: {
    items: basicItems,
    placeholder: 'Select an option',
    disabled: true
  }
};

export const WithShowIndex: Story = {
  args: {
    items: basicItems,
    placeholder: 'Select an option',
    showIndex: true
  }
};

export const PartiallyDisabled: Story = {
  args: {
    items: itemsWithSomeDisabled,
    placeholder: 'Select an available option'
  }
};

export const WithLowCharacters: Story = {
  args: {
    items: [
      {
        value: 'gyj',
        label: 'gyj - GYJ'
      }
    ],
    placeholder: 'Select an option'
  }
};
