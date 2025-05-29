'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import React, { useEffect, useRef } from 'react';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { inputVariants } from './Input';

const inputTextAreaVariants = inputVariants;

interface AutoResizeOptions {
  minRows?: number;
  maxRows?: number;
}

interface PaddingValues {
  top: number;
  bottom: number;
}

const textAreaVariants = cva('leading-1.3', {
  variants: {
    rounding: {
      none: 'rounded-none',
      small: 'rounded-sm!',
      medium: 'rounded-md',
      large: 'rounded-lg',
      xl: 'rounded-xl',
      default: 'rounded'
    }
  }
});

export interface InputTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputTextAreaVariants>,
    VariantProps<typeof textAreaVariants> {
  autoResize?: AutoResizeOptions;
  onPressMetaEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPressEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const InputTextArea = React.forwardRef<HTMLTextAreaElement, InputTextAreaProps>(
  (
    {
      className,
      variant = 'default',
      autoResize,
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
    const paddingRef = useRef<PaddingValues | null>(null);

    const combinedRef = useMemoizedFn((node: HTMLTextAreaElement) => {
      textareaRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    });

    const getPaddingValues = useMemoizedFn(() => {
      if (paddingRef.current) return paddingRef.current;

      const textarea = textareaRef.current;
      if (!textarea) return { top: 0, bottom: 0 };

      const computedStyle = window.getComputedStyle(textarea);
      paddingRef.current = {
        top: Number.parseFloat(computedStyle.paddingTop),
        bottom: Number.parseFloat(computedStyle.paddingBottom)
      };
      return paddingRef.current;
    });

    const calculateMinHeight = useMemoizedFn(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return null;

      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight =
        Number.parseFloat(computedStyle.lineHeight) ||
        Number.parseFloat(computedStyle.fontSize) * 1.2;
      const { top, bottom } = getPaddingValues();

      return (autoResize.minRows || rows) * lineHeight + top + bottom;
    });

    const adjustHeight = useMemoizedFn(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      const minHeight = calculateMinHeight();
      if (!minHeight) return;

      textarea.style.height = 'auto';

      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight =
        Number.parseFloat(computedStyle.lineHeight) ||
        Number.parseFloat(computedStyle.fontSize) * 1.3;
      const { top, bottom } = getPaddingValues();
      const maxHeight = autoResize.maxRows
        ? autoResize.maxRows * lineHeight + top + bottom
        : Number.POSITIVE_INFINITY;

      const scrollHeight = Math.max(textarea.scrollHeight, minHeight);
      const newHeight = Math.min(scrollHeight, maxHeight);

      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    });

    const handleInput = useMemoizedFn(() => {
      requestAnimationFrame(adjustHeight);
    });

    const handleKeyDown = useMemoizedFn((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        if ((e.metaKey || e.ctrlKey) && onPressMetaEnter) {
          e.preventDefault();
          onPressMetaEnter(e);
        } else if (!e.shiftKey) {
          e.preventDefault();
          onPressEnter?.(e);
        }
      }
      props.onKeyDown?.(e);
    });

    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      const minHeight = calculateMinHeight();
      if (minHeight) {
        textarea.style.minHeight = `${minHeight}px`;
      }

      // Set initial height
      adjustHeight();

      textarea.addEventListener('input', handleInput);
      window.addEventListener('resize', adjustHeight);

      return () => {
        textarea.removeEventListener('input', handleInput);
        window.removeEventListener('resize', adjustHeight);
      };
    }, [autoResize]);

    useEffect(() => {
      if (!props.value) adjustHeight();
    }, [props.value]);

    return (
      <textarea
        ref={combinedRef}
        className={cn(
          inputTextAreaVariants({ variant }),
          textAreaVariants({ rounding }),
          'px-2.5 py-2.5',
          autoResize && 'resize-none!',
          className
        )}
        rows={autoResize ? 1 : rows}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);

InputTextArea.displayName = 'InputTextArea';
