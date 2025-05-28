'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { SelectMultiple } from './SelectMultiple';
import { useMemo, useState } from 'react';
import type { SelectItem } from './Select';
import { fn } from '@storybook/test';
import { faker } from '@faker-js/faker';

const meta = {
  title: 'UI/Select/SelectMultiple',
  component: SelectMultiple,
  parameters: {
    // layout: 'fullscreen'
  },
  tags: ['autodocs']
} satisfies Meta<typeof SelectMultiple>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseItems: SelectItem[] = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4' },
  { value: '5', label: 'Option 5' }
];

// Interactive story with state management
const SelectMultipleWithHooks = () => {
  const [items, setItems] = useState<SelectItem[]>(baseItems);
  const [value, setValue] = useState<string[]>([]);

  const handleSelect = (selectedValues: string[]) => {
    setValue(selectedValues);
  };

  return (
    <div className="w-[300px]">
      <SelectMultiple
        items={items}
        onChange={handleSelect}
        placeholder="Select multiple options..."
        value={value}
      />
    </div>
  );
};

export const Default: Story = {
  args: {
    items: baseItems,
    onChange: fn(),
    value: [],
    placeholder: 'Select multiple options...'
  },
  render: () => <SelectMultipleWithHooks />
};

export const WithPreselectedValues: Story = {
  args: {
    items: baseItems,
    value: ['1', '2'],
    onChange: fn(),
    placeholder: 'Select multiple options...'
  },
  render: (args) => (
    <div className="w-[300px]">
      <SelectMultiple {...args} />
    </div>
  )
};

export const Empty: Story = {
  args: {
    items: baseItems,
    onChange: fn(),
    placeholder: 'Select multiple options...',
    value: []
  },
  render: (args) => (
    <div className="w-[300px]">
      <SelectMultiple {...args} />
    </div>
  )
};

export const FullySelected: Story = {
  args: {
    items: baseItems,
    value: baseItems.map((item) => item.value),
    onChange: fn(),
    placeholder: 'Select multiple options...'
  },
  render: (args) => (
    <div className="w-[300px]">
      <SelectMultiple {...args} />
    </div>
  )
};

export const CustomWidth: Story = {
  args: {
    items: baseItems,
    value: ['1'],
    onChange: fn(),
    placeholder: 'Select multiple options...'
  },
  render: (args) => (
    <div className="w-[500px]">
      <SelectMultiple {...args} />
    </div>
  )
};

const WithHundredItemsWithHooks = () => {
  const [value, setValue] = useState<string[]>([]);

  const items = useMemo(
    () =>
      Array.from({ length: 100 }, (_, index) => ({
        value: index.toString(),
        label: faker.company.name()
      })),
    []
  );

  const handleSelect = (selectedValues: string[]) => {
    setValue(selectedValues);
  };

  return (
    <div className="w-[300px]">
      <SelectMultiple
        items={items}
        onChange={handleSelect}
        placeholder="Select multiple options..."
        value={value}
      />
    </div>
  );
};

export const WithHundredItems: Story = {
  args: {
    items: [],
    value: [],
    onChange: fn(),
    placeholder: 'Select multiple options...'
  },
  render: () => <WithHundredItemsWithHooks />
};
