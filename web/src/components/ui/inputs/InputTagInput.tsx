'use client';

import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useMemoizedFn } from '@/hooks';
import { inputVariants } from './Input';
import { InputTag } from './InputTag';

export interface TagInputProps extends VariantProps<typeof inputVariants> {
  tags: string[];
  onTagAdd?: (tag: string) => void;
  onTagRemove?: (index: number) => void;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  className?: string;
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
      placeholder,
      disabled = false,
      maxTags,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const addTag = useMemoizedFn((value: string) => {
      const newTag = value.trim();
      if (newTag !== '' && !tags.includes(newTag)) {
        if (maxTags && tags.length >= maxTags) return;
        onTagAdd?.(newTag);
        setInputValue('');
        // Scroll to the end after adding a new tag
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
      }
    });

    const handleBlur = useMemoizedFn(() => {
      if (inputValue.trim() !== '') {
        addTag(inputValue);
      }
    });

    const handleKeyDown = useMemoizedFn((e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === 'Tab' || e.key === 'Enter' || e.key === ',') && inputValue.trim() !== '') {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0 && !disabled) {
        onTagRemove?.(tags.length - 1);
      }
    });

    const handleInputChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value.endsWith(',')) {
        addTag(value.slice(0, -1));
      } else {
        setInputValue(value);
      }
      onChangeText?.(value);
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
      <div
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
              key={`${tag}-${index}`}
              value={tag}
              label={tag}
              onRemove={() => onTagRemove?.(index)}
              disabled={isDisabledTags}></InputTag>
          ))}
          <input
            ref={ref}
            {...props}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="placeholder:text-gray-light min-w-[120px] flex-1 bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={tags.length === 0 ? placeholder : undefined}
            disabled={isDisabledInput}
          />
        </div>
      </div>
    );
  }
);
InputTagInput.displayName = 'TagInput';

export { InputTagInput };
