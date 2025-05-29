import { useBusterNotifications } from '@/context/BusterNotifications';
import type { Meta, StoryObj } from '@storybook/react';

const TestComponent = ({
  type,
  title,
  message,
  action: actionProp
}: {
  type: 'success' | 'error' | 'warning' | 'info' | 'default';
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) => {
  const {
    openInfoNotification,
    openErrorNotification,
    openWarningNotification,
    openSuccessNotification,
    openNotification
  } = useBusterNotifications();

  const action = actionProp
    ? {
        label: 'Action',
        onClick: () => {
          alert('click');
        }
      }
    : undefined;

  const notification = {
    title,
    message,
    action
  };

  const onClick = () => {
    if (type === 'info') {
      openInfoNotification(notification);
    }
    if (type === 'error') {
      openErrorNotification(notification);
    }
    if (type === 'warning') {
      openWarningNotification(notification);
    }
    if (type === 'success') {
      openSuccessNotification(notification);
    }
    if (type === 'default') {
      openNotification(notification);
    }
  };

  return (
    <div className="min-h-[250px]">
      <div
        className="flex cursor-pointer items-center justify-center p-1 text-center text-black"
        style={{ width: 120 }}
        onClick={onClick}>
        Open Toast
      </div>
    </div>
  );
};

const meta: Meta<typeof TestComponent> = {
  title: 'UI/Toast',
  component: TestComponent,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['success', 'error', 'warning', 'info', 'default'] },
    title: { control: 'text' },
    message: { control: 'text' },
    action: {
      control: 'select',
      options: ['Action', 'No Action']
    }
  },
  decorators: [
    (Story) => {
      return <Story />;
    }
  ]
};

export default meta;

type Story = StoryObj<typeof TestComponent>;

export const Default: Story = {
  args: {
    type: 'info',
    title: 'Hello, world!',
    message: 'This is a test notification'
  }
};

export const Success: Story = {
  args: {
    type: 'success',
    title: 'Success',
    message: 'This is a success notification'
  }
};

export const Error: Story = {
  args: {
    type: 'error',
    title: 'Error',
    message: 'This is an error notification'
  }
};

export const Warning: Story = {
  args: {
    type: 'warning',
    title: 'Warning',
    message: 'This is a warning notification'
  }
};

export const Info: Story = {
  args: {
    type: 'info',
    title: 'Info',
    message: 'This is an info notification'
  }
};

export const DefaultToast: Story = {
  args: {
    type: 'default',
    title: 'Default',
    message: 'This is a default notification'
  }
};
