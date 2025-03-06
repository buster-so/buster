'use client';

import React, { PropsWithChildren } from 'react';
import { toast, type ExternalToast } from 'sonner';
import { useContextSelector, createContext } from 'use-context-selector';
import { Toaster } from '@/components/ui/toaster/Toaster';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface NotificationProps {
  type?: NotificationType;
  title?: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void | (() => Promise<void>);
  };
}

const openNotification = (props: NotificationProps) => {
  const { title, message, type } = props;

  const hasTitle = !!title;

  const toastOptions: ExternalToast = {
    ...props,
    description: !hasTitle && message ? message : message,
    position: 'top-center'
  };

  switch (type) {
    case 'success':
      return toast.success(title, toastOptions);
    case 'info':
      return toast.info(title, toastOptions);
    case 'warning':
      return toast.warning(title, toastOptions);
    case 'error':
      return toast.error(title, toastOptions);
    default:
      return toast(title, toastOptions);
  }
};

const openErrorNotification = (data: NotificationProps | unknown) => {
  const values = data || ({} as any);
  const type = values.type || 'error';
  const title = values.title || 'Error';
  const message = values.message || 'Something went wrong. Please try again.';
  return openNotification({ ...values, message, title, type });
};

const openInfoNotification = ({
  type = 'info',
  message = 'Info',
  title = 'Info',
  ...props
}: NotificationProps) => {
  return openNotification({ ...props, title, message, type });
};

const openSuccessNotification = ({
  type = 'success',
  title = 'Success',
  message = 'success',
  ...props
}: NotificationProps) => {
  return openNotification({ ...props, message, title, type });
};

const openWarningNotification = ({
  type = 'warning',
  title = 'Warning',
  message = 'Warning',
  ...props
}: NotificationProps) => {
  return openNotification({ ...props, message, title, type });
};

const openMessage = (props: {
  type: NotificationType;
  message: string;
  onClose?: () => void;
  duration?: number;
}) => {
  return openNotification({
    ...props,
    title: props.message,
    message: ''
  });
};

const openErrorMessage = (message: string) => {
  return openMessage({ type: 'error', message });
};

const openInfoMessage = (message: string, duration?: number) => {
  return openMessage({ type: 'info', message, duration });
};

const openSuccessMessage = (message: string) => {
  return openMessage({ type: 'success', message });
};

const openConfirmModal = (props: {
  title: string | React.ReactNode;
  content: string | React.ReactNode;
  onOk: () => void;
  onCancel?: () => void;
  icon?: React.ReactNode;
  width?: string | number;
  useReject?: boolean;
  cancelButtonProps?: {
    className?: string;
  };
}): Promise<void> => {
  const useReject = props.useReject ?? true;

  return new Promise((resolve, reject) => {
    // modal.confirm({
    //   icon: props.icon || <></>,
    //   ...props,
    //   className: cx(styles.modal, ''),
    //   cancelButtonProps: {
    //     ...props.cancelButtonProps,
    //     type: 'text'
    //   },
    //   okButtonProps: {
    //     ...props.okButtonProps,
    //     type: 'default'
    //   },
    //   onOk: async () => {
    //     await props.onOk();
    //     resolve();
    //   },
    //   onCancel: async () => {
    //     await props.onCancel?.();
    //     if (useReject) reject();
    //     else resolve();
    //   }
    // });
  });
};

export const useBusterNotificationsInternal = () => {
  return {
    openErrorNotification,
    openInfoNotification,
    openSuccessNotification,
    openWarningNotification,
    openErrorMessage,
    openInfoMessage,
    openSuccessMessage,
    openConfirmModal,
    openNotification
  };
};

const BusterNotifications = createContext<ReturnType<typeof useBusterNotificationsInternal>>(
  {} as ReturnType<typeof useBusterNotificationsInternal>
);

export const BusterNotificationsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const value = useBusterNotificationsInternal();

  return (
    <BusterNotifications.Provider value={value}>
      {children}
      <Toaster />
    </BusterNotifications.Provider>
  );
};

const useBusterNotificationsSelector = <T,>(
  selector: (state: ReturnType<typeof useBusterNotificationsInternal>) => T
) => {
  return useContextSelector(BusterNotifications, selector);
};

export const useBusterNotifications = () => {
  return useBusterNotificationsSelector((state) => state);
};

export { openErrorNotification };
