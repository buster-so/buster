import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';
import { useBusterNotifications } from '../../../context/BusterNotifications';
import { Button } from '../buttons/Button';
import { ConfirmModal, type ConfirmProps } from './ConfirmModal';

const meta: Meta<typeof ConfirmModal> = {
  title: 'UI/Modal/ConfirmModal',
  component: ConfirmModal
};

export default meta;
type Story = StoryObj<typeof ConfirmModal>;

export const Default: Story = {
  render: () => {
    const { openConfirmModal } = useBusterNotifications();

    const props: ConfirmProps<string> = {
      title: 'Confirm',
      content: 'Are you sure you want to confirm this action?',
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        alert('onOk');
        return 'Hello';
      },
      onCancel: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        alert('onCancel');
      }
    };

    return (
      <div className="flex gap-2">
        <Button onClick={() => openConfirmModal(props)}>Open Confirm Modal</Button>
        <Button
          onClick={async () => {
            const res = await openConfirmModal({
              title: 'Confirm',
              content: 'Are you sure you want to confirm this action?',
              onOk: props.onOk,
              onCancel: async () => {
                await new Promise((resolve) => setTimeout(resolve, 1));
                alert('onCancel');
              }
            });
            alert(res);
            alert('openConfirmModal promise resolved');
          }}>
          Open Confirm Modal with a promise
        </Button>
      </div>
    );
  }
};

export const Sequential: Story = {
  render: () => {
    const { openConfirmModal } = useBusterNotifications();

    const handleSequentialModals = async () => {
      await openConfirmModal({
        title: 'First Modal',
        content: 'This is the first modal in the sequence.',
        onOk: fn(),
        onCancel: fn()
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      await openConfirmModal({
        title: 'Second Modal',
        content: 'Here comes the second modal!',
        onOk: fn(),
        onCancel: fn()
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      await openConfirmModal({
        title: 'Final Modal',
        content: 'This is the last modal in our sequence.',
        onOk: fn(),
        onCancel: fn()
      });
    };

    return <Button onClick={handleSequentialModals}>Open Sequential Modals</Button>;
  }
};
