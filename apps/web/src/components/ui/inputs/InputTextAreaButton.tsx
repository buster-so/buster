import { cva } from 'class-variance-authority';
import React, { forwardRef } from 'react';
import { cn } from '@/lib/classMerge';
import { Button } from '../buttons/Button';
import ShapeSquare from '../icons/NucleoIconFilled/shape-square';
import { ArrowUp } from '../icons/NucleoIconOutlined';
import { InputTextArea, type InputTextAreaProps, type InputTextAreaRef } from './InputTextArea';

const inputTextAreaButtonVariants = cva(
  'relative flex flex-col w-full items-center overflow-visible rounded-xl cursor-text border border-border transition-all duration-200',
  {
    variants: {
      variant: {
        default:
          'hover:border-foreground shadow bg-background has-[textarea:focus]:border-foreground has-[textarea:disabled]:border-border',
      },
    },
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
  inputClassName?: string;
}

export const InputTextAreaButton = forwardRef<InputTextAreaRef, InputTextAreaButtonProps>(
  (
    {
      className,
      disabled,
      minRows,
      maxRows,
      sendIcon = <ArrowUp />,
      loadingIcon = <ShapeSquare />,
      loading = false,
      onSubmit,
      onStop,
      variant = 'default',
      inputClassName = '',
      disabledSubmit,
      style,
      ...props
    },
    textRef
  ) => {
    const onSubmitPreflight = () => {
      if (disabled) return;
      const text = (textRef as React.RefObject<InputTextAreaRef | null>).current?.value || '';
      onSubmit(text);
    };

    const onClickBox = () => {
      if (disabled) return;
      if (typeof textRef === 'object' && textRef?.current) {
        textRef.current.focus();
      }
    };

    return (
      <div
        onClick={onClickBox}
        className={cn(
          inputTextAreaButtonVariants({ variant }),
          !disabled && 'transition-all duration-500 hover:shadow-md focus:shadow-lg',
          loading && 'border-border!',
          className
        )}
      >
        <InputTextArea
          ref={textRef}
          disabled={disabled}
          variant="ghost"
          className={cn(
            'leading-1.3 w-full px-5! pt-4! pr-10 align-middle',
            loading && 'opacity-80',
            inputClassName
          )}
          style={style}
          minRows={minRows}
          maxRows={maxRows}
          rounding="xl"
          onPressMetaEnter={onSubmitPreflight}
          onPressEnter={onSubmitPreflight}
          {...props}
        />

        <div className="flex w-full justify-end p-2 pt-0">
          <SubmitButton
            disabled={disabledSubmit}
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
  const prefix = (
    <div
      className={cn('relative h-4 w-4 transition-all duration-300 ease-out will-change-transform')}
    >
      <div
        className={`absolute inset-0 transition-all duration-300 ease-out ${loading ? 'scale-80 opacity-0' : 'scale-100 opacity-100'}`}
      >
        {sendIcon}
      </div>
      <div
        className={`absolute inset-0 flex items-center justify-center text-sm transition-all duration-300 ease-out ${loading ? 'scale-100 opacity-100' : 'scale-85 opacity-0'}`}
      >
        {loadingIcon}
      </div>
    </div>
  );

  return (
    <Button
      rounding={'large'}
      variant="black"
      prefix={prefix}
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
