import React, { useMemo, forwardRef } from 'react';
import { InputTextArea, InputTextAreaProps } from './InputTextArea';
import { cn } from '@/lib/classMerge';
import { cva } from 'class-variance-authority';
import { Button } from '../buttons/Button';
import { ArrowUp } from '../icons/NucleoIconOutlined';
import { ShapeSquare } from '../icons/NucleoIconFilled';
import { useMemoizedFn } from 'ahooks';

const inputTextAreaButtonVariants = cva(
  'relative flex w-full items-center overflow-visible rounded-xl border border-border transition-all duration-200',
  {
    variants: {
      variant: {
        default:
          'has-[textarea:hover]:border-foreground shadow has-[textarea:focus]:border-foreground has-[textarea:disabled]:border-border'
      }
    }
  }
);

export interface InputTextAreaButtonProps extends Omit<InputTextAreaProps, 'variant' | 'onSubmit'> {
  sendIcon?: React.ReactNode;
  loadingIcon?: React.ReactNode;
  loading?: boolean;
  onSubmit: (text: string) => void;
  onStop?: () => void;
  variant?: 'default';
  disabledSubmit?: boolean;
}

export const InputTextAreaButton = forwardRef<HTMLTextAreaElement, InputTextAreaButtonProps>(
  (
    {
      className,
      disabled,
      autoResize,
      sendIcon = <ArrowUp />,
      loadingIcon = <ShapeSquare />,
      loading = false,
      onSubmit,
      onStop,
      variant = 'default',
      disabledSubmit,
      ...props
    },
    textRef
  ) => {
    const onSubmitPreflight = useMemoizedFn(() => {
      if (disabled) return;
      const text = (textRef as React.RefObject<HTMLTextAreaElement | null>).current?.value || '';
      onSubmit(text);
    });

    return (
      <div
        className={cn(
          inputTextAreaButtonVariants({ variant }),
          loading && 'border-border!',
          className
        )}>
        <InputTextArea
          ref={textRef}
          disabled={disabled || loading}
          variant="ghost"
          className={cn(
            'leading-1.3 w-full px-5! py-4! pr-10 align-middle transition-all duration-500',
            loading && 'cursor-not-allowed! opacity-70'
          )}
          autoResize={autoResize}
          rounding="xl"
          onPressMetaEnter={onSubmitPreflight}
          onPressEnter={onSubmitPreflight}
          {...props}
        />

        <div className="absolute right-2 bottom-2">
          <SubmitButton
            disabled={disabled || disabledSubmit}
            loading={loading}
            sendIcon={sendIcon}
            loadingIcon={loadingIcon}
            onStop={onStop}
            onSubmitPreflight={onSubmitPreflight}
          />
        </div>
      </div>
    );
  }
);

InputTextAreaButton.displayName = 'InputTextAreaButton';

const SubmitButton: React.FC<{
  loading: boolean;
  disabled?: boolean;
  sendIcon: React.ReactNode;
  loadingIcon: React.ReactNode;
  onSubmitPreflight: () => void;
  onStop?: () => void;
}> = React.memo(({ disabled, sendIcon, loading, loadingIcon, onSubmitPreflight, onStop }) => {
  const memoizedPrefix = useMemo(() => {
    return (
      <div
        className={cn(
          'relative h-4 w-4 transition-all duration-300 ease-out will-change-transform'
        )}>
        <div
          className={`absolute inset-0 transition-all duration-300 ease-out ${loading ? 'scale-80 opacity-0' : 'scale-100 opacity-100'}`}>
          {sendIcon}
        </div>
        <div
          className={`absolute inset-0 flex items-center justify-center text-sm transition-all duration-300 ease-out ${loading ? 'scale-100 opacity-100' : 'scale-85 opacity-0'}`}>
          {loadingIcon}
        </div>
      </div>
    );
  }, [loading, sendIcon, loadingIcon]);

  return (
    <Button
      rounding={'large'}
      variant="black"
      prefix={memoizedPrefix}
      onClick={loading && onStop ? onStop : onSubmitPreflight}
      disabled={disabled}
      className={cn(
        'origin-center transform-gpu transition-all duration-300 ease-out will-change-transform',
        !disabled && 'hover:scale-110 active:scale-95'
      )}
    />
  );
});

SubmitButton.displayName = 'SubmitButton';
