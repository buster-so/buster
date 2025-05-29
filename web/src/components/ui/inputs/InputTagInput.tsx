'use client';

import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { inputVariants } from './Input';
import { InputTag } from './InputTag';

export interface TagInputProps extends VariantProps<typeof inputVariants> {
  tags: string[];
  onTagAdd?: (tag: string | string[]) => void;
  onTagRemove?: (index: number) => void;
  onChangeText?: (text: string) => void;
  onPressEnter?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  className?: string;
  delimiter?: string;
}

const InputTagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      tags = [],
      onTagAdd,
      onTagRemove,
      onChangeText,
      onPressEnter,
      placeholder,
      disabled = false,
      maxTags,
      delimiter = ',',
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState('');
    const containerRef = React.useRef<HTMLButtonElement>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const addMultipleTags = useMemoizedFn((value: string) => {
      const newTags = value
        .split(delimiter)
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '' && !tags.includes(tag));

      if (maxTags) {
        const availableSlots = maxTags - tags.length;
        const validTags = newTags.slice(0, availableSlots);
        onTagAdd?.(validTags);
      } else {
        onTagAdd?.(newTags);
      }

      setInputValue('');

      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
      });
    });

    const handleBlur = useMemoizedFn(() => {
      if (inputValue.trim() !== '') {
        addMultipleTags(inputValue);
      }
    });

    const handleKeyDown = useMemoizedFn((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        (e.key === 'Tab' || e.key === 'Enter' || e.key === delimiter) &&
        inputValue.trim() !== ''
      ) {
        e.preventDefault();
        addMultipleTags(inputValue);
      } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0 && !disabled) {
        onTagRemove?.(tags.length - 1);
      }

      if (e.key === 'Enter' && inputValue.trim() === '') {
        onPressEnter?.();
      }
    });

    const handleInputChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value.includes(delimiter)) {
        addMultipleTags(value);
      } else {
        setInputValue(value);
        onChangeText?.(value);
      }
    });

    const handlePaste = useMemoizedFn((e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData('text');
      if (pastedText.includes(delimiter)) {
        e.preventDefault();
        addMultipleTags(pastedText);
      }
      // If no delimiter is found, let the default paste behavior handle it
    });

    // Focus the container when clicked
    const handleContainerClick = useMemoizedFn(() => {
      const input = containerRef.current?.querySelector('input');
      if (input && !disabled) {
        input.focus();
      }
    });

    // Add gap classes based on variant
    const gapClasses = variant === 'ghost' ? 'gap-2' : variant === 'default' ? 'gap-2' : 'gap-1';

    // Determine if the component is disabled
    const isDisabledTags = disabled;
    const isDisabledInput = disabled || (maxTags !== undefined && tags.length >= maxTags);

    return (
      <button
        type="button"
        ref={containerRef}
        className={cn(
          inputVariants({ variant, size }),
          gapClasses,
          'flex items-center',
          isDisabledInput && 'bg-item-select cursor-not-allowed',
          className
        )}
        onClick={handleContainerClick}>
        <div
          ref={scrollRef}
          className={cn(
            'scrollbar-none flex flex-1 items-center gap-1.5 overflow-x-auto py-1 whitespace-nowrap'
          )}>
          {tags.map((tag, index) => (
            <InputTag
              key={`${tag}-${index.toString()}`}
              value={tag}
              label={tag}
              onRemove={() => onTagRemove?.(index)}
              disabled={isDisabledTags}
            />
          ))}
          <input
            ref={ref}
            {...props}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onPaste={handlePaste}
            className="placeholder:text-gray-light min-w-[120px] flex-1 bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={tags.length === 0 ? placeholder : undefined}
            disabled={isDisabledInput}
          />
        </div>
      </button>
    );
  }
);
InputTagInput.displayName = 'TagInput';

export { InputTagInput };
