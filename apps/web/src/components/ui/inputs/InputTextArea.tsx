import { cva, type VariantProps } from 'class-variance-authority';
import React, { useImperativeHandle, useRef } from 'react';
import TextareaAutosize, { type TextareaAutosizeProps } from 'react-textarea-autosize';
import { cn } from '@/lib/classMerge';
import { inputVariants } from './Input';

const inputTextAreaVariants = inputVariants;

const textAreaVariants = cva('leading-1.3', {
  variants: {
    rounding: {
      none: 'rounded-none',
      small: 'rounded-sm!',
      medium: 'rounded-md',
      large: 'rounded-lg',
      xl: 'rounded-xl',
      default: 'rounded',
    },
  },
});

export interface InputTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    Omit<TextareaAutosizeProps, 'style'>,
    VariantProps<typeof inputTextAreaVariants>,
    VariantProps<typeof textAreaVariants> {
  onPressMetaEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPressEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export interface InputTextAreaRef extends HTMLTextAreaElement {
  forceRecalculateHeight?: () => void;
}

export const InputTextArea = React.forwardRef<InputTextAreaRef, InputTextAreaProps>(
  (
    {
      className,
      variant = 'default',
      style,
      rows = 1,
      rounding = 'default',
      onPressMetaEnter,
      onPressEnter,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(ref, () => {
      if (!textareaRef.current) {
        return null as unknown as InputTextAreaRef;
      }
      return Object.assign(textareaRef.current, {
        forceRecalculateHeight: () => {
          if (textareaRef.current) {
            // Force a recalculation by triggering an input event
            const event = new Event('input', { bubbles: true });
            textareaRef.current.dispatchEvent(event);
          }
        },
      });
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        if ((e.metaKey || e.ctrlKey) && onPressMetaEnter) {
          e.preventDefault();
          onPressMetaEnter(e);
        } else if (!e.shiftKey && onPressEnter) {
          e.preventDefault();
          onPressEnter(e);
        }
      }
      props.onKeyDown?.(e);
    };

    return (
      <TextareaAutosize
        ref={textareaRef}
        className={cn(
          inputTextAreaVariants({ variant }),
          textAreaVariants({ rounding }),
          'px-2.5 py-2.5 resize-none! box-border',
          className
        )}
        onKeyDown={handleKeyDown}
        style={style as Omit<React.CSSProperties, 'height'>}
        cacheMeasurements={false}
        {...props}
      />
    );
  }
);

InputTextArea.displayName = 'InputTextArea';