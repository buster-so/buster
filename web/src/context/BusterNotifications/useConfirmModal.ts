import type {
  ConfirmProps as BaseConfirmProps,
  ConfirmModalProps
} from '@/components/ui/modal/ConfirmModal';
import { useMemo, useState } from 'react';

interface ConfirmProps<T = unknown> extends Omit<BaseConfirmProps, 'onOk'> {
  title: string | React.ReactNode;
  content: string | React.ReactNode;
  onOk: () => T | Promise<T>;
  onCancel?: () => Promise<void>;
}

const defaultConfirmModalProps: ConfirmProps<unknown> = {
  title: '',
  content: '',
  onOk: () => undefined,
  onCancel: async () => {}
};

interface QueuedModal<T = unknown> extends Omit<ConfirmProps<T>, 'onOk' | 'onCancel'> {
  resolve: (value: T | undefined) => void;
  reject: (reason?: unknown) => void;
  onClose: () => void;
  onOk: () => Promise<void>;
  onCancel?: () => Promise<void>;
}

export const useOpenConfirmModal = () => {
  const [modalQueue, setModalQueue] = useState<QueuedModal[]>([]);
  const currentModal = modalQueue[0]; // Get the first modal in the queue

  const openConfirmModal = <T = unknown>(props: ConfirmProps<T>): Promise<T | undefined> | T => {
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
            // Remove the current modal from the queue
            setModalQueue((prev) => prev.slice(1));
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
                  // Remove the current modal from the queue
                  setModalQueue((prev) => prev.slice(1));
                }
              }
            : undefined,
        onClose: () => {
          resolve(undefined);
          setModalQueue((prev) => prev.slice(1));
        }
      };

      setModalQueue((prev) => [...prev, newModal] as QueuedModal<unknown>[]);
    });
  };

  const confirmModalProps: ConfirmModalProps = useMemo(() => {
    return currentModal
      ? {
          ...currentModal,
          open: true
        }
      : {
          ...defaultConfirmModalProps,
          open: false,
          onClose: () => {}
        };
  }, [currentModal]);

  return useMemo(() => {
    return { openConfirmModal, confirmModalProps };
  }, [openConfirmModal, confirmModalProps]);
};
