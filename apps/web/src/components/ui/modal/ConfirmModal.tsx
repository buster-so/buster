import React from 'react';
import { AppModal } from './AppModal';

export interface ConfirmProps<T = unknown> {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  content: string | React.ReactNode;
  onOk: (() => Promise<T>) | (() => T);
  onCancel?: () => Promise<void>;
  width?: number;
  cancelButtonProps?: {
    text?: string;
    hide?: boolean;
  };
  showClose?: boolean;
  primaryButtonProps?: {
    text?: string;
  };
  preventCloseOnClickOutside?: boolean;
}

export interface ConfirmModalProps extends ConfirmProps {
  open: boolean;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = React.memo(
  ({
    title,
    content,
    onOk,
    onCancel,
    width,
    cancelButtonProps,
    description,
    open,
    onClose,
    showClose = true,
    primaryButtonProps,
    preventCloseOnClickOutside = true
  }) => {
    return (
      <AppModal
        open={open}
        width={width}
        preventCloseOnClickOutside={preventCloseOnClickOutside}
        onClose={onClose}
        showClose={showClose}
        header={{
          title,
          description
        }}
        footer={{
          secondaryButton: onCancel
            ? {
                text: cancelButtonProps?.text ?? 'Cancel',
                onClick: onCancel
              }
            : undefined,
          primaryButton: {
            text: primaryButtonProps?.text ?? 'Submit',
            onClick: onOk
          }
        }}>
        {content}
      </AppModal>
    );
  }
);

ConfirmModal.displayName = 'ConfirmModal';
