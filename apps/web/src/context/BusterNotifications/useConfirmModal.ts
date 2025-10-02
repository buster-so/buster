import { useMemo, useState } from 'react';
import type {
  ConfirmProps as BaseConfirmProps,
  ConfirmModalProps,
} from '@/components/ui/modal/ConfirmModal';
import { USER_CANCELLED_ERROR } from '../../integrations/tanstack-query/query-client-config';

interface ConfirmProps<T = unknown, C = unknown>
  extends Omit<BaseConfirmProps, 'onOk' | 'onCancel'> {
  title: string | React.ReactNode;
  content: string | React.ReactNode;
  onOk: () => T | Promise<T>;
  onCancel?: () => Promise<void>;
}

const defaultConfirmModalProps: ConfirmProps<unknown, unknown> = {
  title: '',
  content: '',
  onOk: () => undefined,
  onCancel: async () => Promise.reject(USER_CANCELLED_ERROR),
};

interface QueuedModal<T = unknown> extends Omit<ConfirmProps<T>, 'onOk' | 'onCancel'> {
  resolve: (value: T | undefined) => void;
  reject: (reason?: unknown) => void;
  onClose: () => void;
  onOk: () => Promise<void>;
  onCancel?: () => Promise<void>;
  closing?: boolean;
}

export const useConfirmModalContext = () => {
  const [modalQueue, setModalQueue] = useState<QueuedModal[]>([]);
  const currentModal = modalQueue[0]; // Get the first modal in the queue

  // Common handler to close modal and then remove from queue after animation
  const closeModalWithDelay = () => {
    // Mark modal as closing (triggers close animation)
    setModalQueue((prev) => {
      if (prev.length === 0) return prev;
      return [{ ...prev[0], closing: true }, ...prev.slice(1)];
    });

    // Remove from queue after animation completes
    setTimeout(() => {
      setModalQueue((prev) => prev.slice(1));
    }, 250);
  };

  const openConfirmModal = <T = unknown, C = unknown>(
    props: ConfirmProps<T>
  ): Promise<T | undefined> | T => {
    return new Promise<T | undefined>((resolve, reject) => {
      const newModal: QueuedModal<T> = {
        ...props,
        resolve,
        reject,
        onOk: async () => {
          try {
            const res = await Promise.resolve(props.onOk());
            resolve(res);
          } catch (error) {
            reject(error);
          } finally {
            closeModalWithDelay();
          }
        },
        onCancel:
          props.cancelButtonProps?.hide !== true
            ? async () => {
                try {
                  await props.onCancel?.();
                  resolve(undefined);
                } catch (error) {
                  reject(error);
                } finally {
                  closeModalWithDelay();
                }
              }
            : undefined,
        onClose: () => {
          resolve(undefined);
          closeModalWithDelay();
        },
      };

      setModalQueue((prev) => [...prev, newModal] as QueuedModal<unknown>[]);
    });
  };

  const confirmModalProps: ConfirmModalProps = useMemo(() => {
    return currentModal
      ? {
          ...currentModal,
          open: !currentModal.closing,
        }
      : {
          ...defaultConfirmModalProps,
          open: false,
          onClose: () => {},
        };
  }, [currentModal]);

  return useMemo(() => {
    return { openConfirmModal, confirmModalProps };
  }, [openConfirmModal, confirmModalProps]);
};
