import { Button } from '@/components/ui/buttons';
import { Cat, Dog, Garage } from '@/components/ui/icons';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';
import { BusterListSelectedOptionPopupContainer } from './ListSelectedOptionPopup';

const meta: Meta<typeof BusterListSelectedOptionPopupContainer> = {
  title: 'UI/List/ListSelectedOptionPopup',
  component: BusterListSelectedOptionPopupContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    selectedRowKeys: { control: 'object' },
    onSelectChange: { action: 'onSelectChange' },
    buttons: { control: 'object' },
    show: { control: 'boolean' }
  },
  decorators: [
    (Story) => (
      <div className="bg-background relative h-[200px] w-full min-w-[500px]">
        <Story />
      </div>
    )
  ]
};

export default meta;

type Story = StoryObj<typeof BusterListSelectedOptionPopupContainer>;

// Sample data
const sampleSelectedRowKeys = ['1', '2', '3'];

// Define actions
const deleteAction = fn();
const editAction = fn();
const addAction = fn();
const viewAction = fn();
const selectionChangedAction = fn();

export const Default: Story = {
  args: {
    selectedRowKeys: sampleSelectedRowKeys,
    onSelectChange: (keys) => selectionChangedAction(keys),
    show: true
  }
};

export const WithButtons: Story = {
  args: {
    selectedRowKeys: sampleSelectedRowKeys,
    onSelectChange: (keys) => selectionChangedAction(keys),
    buttons: [
      <Button key="delete" prefix={<Garage />} onClick={deleteAction}>
        Delete
      </Button>,
      <Button key="edit" prefix={<Dog />} onClick={editAction}>
        Edit
      </Button>
    ],
    show: true
  }
};

export const Hidden: Story = {
  args: {
    selectedRowKeys: [],
    onSelectChange: (keys) => selectionChangedAction(keys),
    show: false
  }
};

export const ForceShow: Story = {
  args: {
    selectedRowKeys: [],
    onSelectChange: (keys) => selectionChangedAction(keys),
    buttons: [
      <Button key="add" prefix={<Garage />} onClick={addAction}>
        Add
      </Button>
    ],
    show: true
  },
  name: 'Force Show (Even With Empty Selection)'
};

export const SingleSelection: Story = {
  args: {
    selectedRowKeys: ['1'],
    onSelectChange: (keys) => selectionChangedAction(keys),
    buttons: [
      <Button key="view" prefix={<Cat />} onClick={viewAction}>
        View
      </Button>,
      <Button key="delete" prefix={<Dog />} onClick={deleteAction}>
        Delete
      </Button>
    ],
    show: true
  }
};
