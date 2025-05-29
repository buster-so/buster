'use client';

import React, { type ReactNode, useMemo, useState } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/classMerge';
import { Button, type ButtonProps } from '../buttons/Button';
import { AppTooltip } from '../tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ModalBase';

export interface BorderedModalProps {
  children: React.ReactNode;
  width?: number;
  footer: {
    left?: React.ReactNode;
    primaryButton: {
      text: string;
      onClick: (() => Promise<void>) | (() => void);
      variant?: ButtonProps['variant'];
      loading?: boolean;
      disabled?: boolean;
      tooltip?: string;
    };
    secondaryButton?: {
      text: string;
      onClick: () => void;
      variant?: ButtonProps['variant'];
      loading?: boolean;
      disabled?: boolean;
    };
  };
  header?:
    | {
        title: string;
        description?: string;
      }
    | ReactNode;
  open: boolean;
  onClose: () => void;
  className?: string;
  scrollAreaClassName?: string;
}

export const BorderedModal = React.memo(
  ({
    children,
    width = 600,
    footer,
    header,
    open,
    onClose,
    className = ''
  }: BorderedModalProps) => {
    const [isLoadingPrimaryButton, setIsLoadingPrimaryButton] = useState(false);

    const onPrimaryButtonClickPreflight = useMemoizedFn(async () => {
      setIsLoadingPrimaryButton(true);
      await footer.primaryButton.onClick();
      setIsLoadingPrimaryButton(false);
    });

    const onOpenChange = useMemoizedFn((open: boolean) => {
      if (!open) {
        onClose();
      }
    });

    const memoizedStyle = useMemo(() => {
      return {
        width: width,
        maxWidth: width
      };
    }, [width]);

    const headerIsTitleObject = isHeaderTitleObject(header);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(className)}
          style={memoizedStyle}
          showClose={headerIsTitleObject}>
          {header && (
            <DialogHeader
              className={cn('border-b', headerIsTitleObject ? 'px-6 pt-6 pb-4' : 'space-y-0!')}>
              {headerIsTitleObject ? (
                <>
                  <DialogTitle>{header.title}</DialogTitle>
                  <DialogDescription>{header.description}</DialogDescription>
                </>
              ) : (
                header
              )}
            </DialogHeader>
          )}

          {children}

          {footer && (
            <DialogFooter
              className={cn('flex items-center', footer.left ? 'justify-between' : 'justify-end')}>
              {footer.left && footer.left}
              <div className={cn('flex items-center space-x-2')}>
                {footer.secondaryButton && (
                  <Button
                    onClick={footer.secondaryButton.onClick}
                    variant={footer.secondaryButton.variant ?? 'ghost'}
                    loading={footer.secondaryButton.loading}
                    disabled={footer.secondaryButton.disabled}>
                    {footer.secondaryButton.text}
                  </Button>
                )}
                <span>
                  <AppTooltip
                    title={footer.primaryButton.tooltip}
                    sideOffset={8}
                    delayDuration={400}>
                    <Button
                      onClick={onPrimaryButtonClickPreflight}
                      variant={footer.primaryButton.variant ?? 'black'}
                      loading={footer.primaryButton.loading ?? isLoadingPrimaryButton}
                      disabled={footer.primaryButton.disabled}>
                      {footer.primaryButton.text}
                    </Button>
                  </AppTooltip>
                </span>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);

const isHeaderTitleObject = (
  header:
    | {
        title: string;
        description?: string;
      }
    | ReactNode
): header is {
  title: string;
  description?: string;
} => {
  return typeof header === 'object' && header !== null && 'title' in header;
};
