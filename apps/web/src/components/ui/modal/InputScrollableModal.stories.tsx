import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';
import { useSet } from '@/hooks';
import { InputSelectModal, type InputSelectModalProps } from './InputSelectModal';

// Define the data type for the list items
type ListItemData = {
  name: string;
  email: string;
};

const meta: Meta<typeof InputSelectModal<ListItemData>> = {
  title: 'UI/Modal/InputSelectModal',
  component: InputSelectModal,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof InputSelectModal<ListItemData>>;

export const Default: Story = {
  render: (args) => {
    const [selectedItems, { replace }] = useSet<string>();

    const onSelectChange = (items: string[]) => {
      replace(items);
    };

    return (
      <InputSelectModal<ListItemData>
        {...args}
        open={true}
        selectedRowKeys={Array.from(selectedItems)}
        onSelectChange={onSelectChange}
      />
    );
  },
  args: {
    inputPlaceholder: 'Search items...',
    footer: {
      primaryButton: {
        text: 'Confirm',
        onClick: fn()
      },
      secondaryButton: {
        text: 'Cancel',
        onClick: fn(),
        variant: 'ghost'
      }
    },
    columns: [
      {
        title: 'Name',
        dataIndex: 'name' as const
      },
      {
        title: 'Email',
        dataIndex: 'email' as const
      }
    ] satisfies InputSelectModalProps<ListItemData>['columns'],
    selectedRowKeys: [],
    rows: Array.from({ length: 3000 }, () => ({
      id: faker.string.uuid(),
      data: { name: faker.person.fullName(), email: faker.internet.email() } as ListItemData
    }))
  }
};
