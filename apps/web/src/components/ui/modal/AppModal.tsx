import type React from 'react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/classMerge';
import { Button, type ButtonProps } from '../buttons/Button';
import { AppTooltip } from '../tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ModalBase';

export interface ModalProps<T = unknown> {
  className?: string;
  style?: React.CSSProperties;
  preventCloseOnClickOutside?: boolean;
  open: boolean;
  onClose: () => void;
  footer: {
    left?: React.ReactNode;
    primaryButton: {
      text: string;
      onClick: () => Promise<T> | T;
      variant?: ButtonProps['variant'];
      loading?: boolean;
      disabled?: boolean;
      tooltip?: string;
    };
    secondaryButton?: {
      text: string;
      onClick: () => Promise<T> | T;
      variant?: ButtonProps['variant'];
      loading?: boolean;
      disabled?: boolean;
      tooltip?: string;
    };
  };
  header: {
    title: React.ReactNode;
    description?: React.ReactNode;
  };
  width?: number;
  children?: React.ReactNode;
  showClose?: boolean;
}

export const AppModal = <T,>({
  open,
  preventCloseOnClickOutside = false,
  onClose,
  footer,
  header,
  width = 600,
  className,
  style,
  showClose = true,
  children,
}: ModalProps<T>) => {
  const [isLoadingPrimaryButton, setIsLoadingPrimaryButton] = useState(false);
  const [isLoadingSecondaryButton, setIsLoadingSecondaryButton] = useState(false);

  const onOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const memoizedStyle = useMemo(
    () => ({
      minWidth: width ?? 600,
      maxWidth: width ?? 600,
      ...style,
    }),
    [width, style]
  );

  const onPrimaryButtonClickPreflight = async () => {
    setIsLoadingPrimaryButton(true);
    try {
      const result = await footer.primaryButton.onClick();
      return result;
    } finally {
      setIsLoadingPrimaryButton(false);
    }
  };

  const onSecondaryButtonClickPreflight = async () => {
    if (!footer.secondaryButton) return;
    setIsLoadingSecondaryButton(true);
    try {
      const result = await footer.secondaryButton.onClick();
      return result;
    } finally {
      setIsLoadingSecondaryButton(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={className}
        style={memoizedStyle}
        showClose={showClose}
        onPointerDownOutside={(e) => {
          if (preventCloseOnClickOutside) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex flex-col gap-4 overflow-hidden p-6">
          {header && (
            <>
              <DialogHeader className="">
                {header.title && <DialogTitle>{header.title}</DialogTitle>}
                {header.description && <DialogDescription>{header.description}</DialogDescription>}
              </DialogHeader>
              <DialogDescription hidden>{header.description || header.title}</DialogDescription>
            </>
          )}

          {children}
        </div>

        {footer && (
          <DialogFooter
            className={cn('flex items-center', footer.left ? 'justify-between' : 'justify-end')}
          >
            {footer.left && footer.left}
            <div className={cn('flex items-center space-x-2')}>
              {footer.secondaryButton && (
                <AppTooltip title={footer.secondaryButton.tooltip}>
                  <Button
                    onClick={onSecondaryButtonClickPreflight}
                    variant={footer.secondaryButton.variant ?? 'ghost'}
                    loading={footer.secondaryButton.loading ?? isLoadingSecondaryButton}
                    disabled={footer.secondaryButton.disabled}
                  >
                    {footer.secondaryButton.text}
                  </Button>
                </AppTooltip>
              )}
              <AppTooltip title={footer.primaryButton.tooltip}>
                <Button
                  onClick={onPrimaryButtonClickPreflight}
                  variant={footer.primaryButton.variant ?? 'black'}
                  loading={footer.primaryButton.loading ?? isLoadingPrimaryButton}
                  disabled={footer.primaryButton.disabled}
                >
                  {footer.primaryButton.text}
                </Button>
              </AppTooltip>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

AppModal.displayName = 'AppModal';
