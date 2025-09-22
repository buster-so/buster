import type React from 'react';
import type { PropsWithChildren } from 'react';
import { lazy, Suspense, useCallback } from 'react';
import { type ExternalToast, toast } from 'sonner';
import { createContext, useContextSelector } from 'use-context-selector';
import { Toaster } from '@/components/ui/toaster/Toaster';
import { useConfirmModalContext } from './useConfirmModal';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

const ConfirmModal = lazy(() =>
  import('@/components/ui/modal/ConfirmModal').then((mod) => ({ default: mod.ConfirmModal }))
);

export type NotificationProps = {
  type?: NotificationType;
  title?: string;
  message?: string | React.ReactNode;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void | (() => Promise<void>);
  };
} & ExternalToast;

const openNotification = (props: NotificationProps) => {
  const { title, message, type } = props;

  const hasTitle = !!title;

  const toastOptions: ExternalToast = {
    ...props,
    description: !hasTitle && message ? message : message,
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
  const values = typeof data === 'object' && data !== null ? (data as NotificationProps) : {};
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
    message: '',
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

const useBusterNotificationsInternal = () => {
  return {
    openErrorNotification,
    openInfoNotification,
    openSuccessNotification,
    openWarningNotification,
    openErrorMessage,
    openInfoMessage,
    openSuccessMessage,
    openNotification,
  };
};

type BusterNotificationsContext = ReturnType<typeof useBusterNotificationsInternal> & {
  openConfirmModal: ReturnType<typeof useConfirmModalContext>['openConfirmModal'];
};

const BusterNotifications = createContext<BusterNotificationsContext>(
  {} as BusterNotificationsContext
);

export const BusterNotificationsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { openConfirmModal, confirmModalProps } = useConfirmModalContext();
  const value = useBusterNotificationsInternal();

  return (
    <BusterNotifications.Provider value={{ ...value, openConfirmModal }}>
      {children}
      <Toaster />
      <Suspense fallback={<span className="hidden">...</span>}>
        <ConfirmModal {...confirmModalProps} />
      </Suspense>
    </BusterNotifications.Provider>
  );
};

const useBusterNotificationsSelector = <T,>(selector: (state: BusterNotificationsContext) => T) => {
  return useContextSelector(BusterNotifications, selector);
};

export const useBusterNotifications = () => {
  return useBusterNotificationsSelector(useCallback((state) => state, []));
};

export { openErrorNotification };

export const useOpenConfirmModal = () => {
  return useBusterNotificationsSelector(
    useCallback(({ openConfirmModal }) => {
      return openConfirmModal;
    }, [])
  );
};
