import { useSet } from '@/hooks';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';
import { InputSelectModal } from './InputSelectModal';

const meta: Meta<typeof InputSelectModal> = {
  title: 'UI/Modal/InputSelectModal',
  component: InputSelectModal,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof InputSelectModal>;

export const Default: Story = {
  render: (args) => {
    const [selectedItems, { replace }] = useSet<string>();

    const onSelectChange = (items: string[]) => {
      replace(items);
    };

    return (
      <InputSelectModal
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
        dataIndex: 'name'
      },
      {
        title: 'Email',
        dataIndex: 'email'
      }
    ],
    selectedRowKeys: [],
    rows: Array.from({ length: 3000 }, () => ({
      id: faker.string.uuid(),
      data: { name: faker.person.fullName(), email: faker.internet.email() }
    }))
  }
};
