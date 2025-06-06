import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Window, WindowSettings, WindowUser } from '@/components/ui/icons/NucleoIconOutlined';
import { Combobox } from './Combobox';

const meta: Meta<typeof Combobox> = {
  title: 'UI/Combobox/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Combobox>;

const defaultOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' }
];

const optionsWithIcons = [
  { value: 'window', label: 'Window', icon: <Window /> },
  { value: 'user', label: 'User', icon: <WindowUser /> },
  { value: 'settings', label: 'Settings', icon: <WindowSettings /> }
];

const optionsWithSecondaryLabels = [
  { value: 'option1', label: 'Option 1', secondaryLabel: 'Description 1' },
  { value: 'option2', label: 'Option 2', secondaryLabel: 'Description 2' },
  { value: 'option3', label: 'Option 3', secondaryLabel: 'Description 3' }
];

export const Default: Story = {
  args: {
    options: defaultOptions,
    value: '',
    selectType: 'single',
    placeholder: 'Select an option...',
    onChange: fn()
  }
};

export const DefaultSingleSelected: Story = {
  args: {
    options: defaultOptions,
    value: 'option1',
    selectType: 'single',
    onChange: fn()
  }
};

export const DefaultMultipleSelected: Story = {
  args: {
    options: defaultOptions,
    value: ['option1', 'option3'],
    selectType: 'multiple',
    onChange: fn()
  }
};

export const WithIcons: Story = {
  args: {
    options: optionsWithIcons,
    value: '',
    selectType: 'single',
    placeholder: 'Select an option with icon...',
    onChange: fn()
  }
};

export const WithIconsAndIndex: Story = {
  args: {
    options: optionsWithIcons,
    value: '',
    selectType: 'single',
    placeholder: 'Select an option with icon...',
    onChange: fn(),
    useIndex: true
  }
};

export const WithSecondaryLabels: Story = {
  args: {
    options: optionsWithSecondaryLabels,
    value: '',
    selectType: 'single',
    placeholder: 'Select an option with description...',
    onChange: fn()
  }
};

export const WithSelectedValue: Story = {
  args: {
    options: defaultOptions,
    value: 'option2',
    selectType: 'single',
    placeholder: 'Select an option...',
    onChange: fn()
  }
};

export const MultipleSelection: Story = {
  args: {
    options: defaultOptions,
    value: ['option1', 'option3'],
    selectType: 'multiple',
    placeholder: 'Select multiple options...',
    onChange: fn()
  }
};

export const WithAllFeatures: Story = {
  args: {
    options: [
      {
        value: 'window',
        label: 'Window Settings',
        icon: <Window />,
        secondaryLabel: 'Configure window'
      },
      {
        value: 'user',
        label: 'User Profile',
        icon: <WindowUser />,
        secondaryLabel: 'Manage account'
      },
      {
        value: 'settings',
        label: 'System Settings',
        icon: <WindowSettings />,
        secondaryLabel: 'System preferences'
      }
    ],
    value: ['settings'],
    selectType: 'multiple',
    placeholder: 'Your moms options...',
    useIndex: true,
    onChange: fn()
  }
};
