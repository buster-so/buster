'use client';

import * as React from 'react';

import type { TElement } from 'platejs';

import { toUnitLess } from '@platejs/basic-styles';
import { FontSizePlugin } from '@platejs/basic-styles/react';
import { Minus, Plus } from '@/components/ui/icons';
import { KEYS } from 'platejs';
import { useEditorPlugin, useEditorSelector } from 'platejs/react';

import { PopoverBase, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { ToolbarButton } from './Toolbar';

const DEFAULT_FONT_SIZE = '16';

const FONT_SIZE_MAP = {
  h1: '36',
  h2: '24',
  h3: '20'
} as const;

const FONT_SIZES = [
  '8',
  '9',
  '10',
  '12',
  '14',
  '16',
  '18',
  '24',
  '30',
  '36',
  '48',
  '60',
  '72',
  '96'
] as const;

export function FontSizeToolbarButton() {
  const [inputValue, setInputValue] = React.useState(DEFAULT_FONT_SIZE);
  const [isFocused, setIsFocused] = React.useState(false);
  const { editor, tf } = useEditorPlugin(FontSizePlugin);

  const cursorFontSize = useEditorSelector((editor) => {
    const fontSize = editor.api.marks()?.[KEYS.fontSize];

    if (fontSize) {
      return toUnitLess(fontSize as string);
    }

    const [block] = editor.api.block<TElement>() || [];

    if (!block?.type) return DEFAULT_FONT_SIZE;

    return block.type in FONT_SIZE_MAP
      ? FONT_SIZE_MAP[block.type as keyof typeof FONT_SIZE_MAP]
      : DEFAULT_FONT_SIZE;
  }, []);

  const handleInputChange = () => {
    const newSize = toUnitLess(inputValue);

    if (Number.parseInt(newSize) < 1 || Number.parseInt(newSize) > 100) {
      editor.tf.focus();

      return;
    }
    if (newSize !== toUnitLess(cursorFontSize)) {
      tf.fontSize.addMark(`${newSize}px`);
    }

    editor.tf.focus();
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Number(displayValue) + delta;
    tf.fontSize.addMark(`${newSize}px`);
    editor.tf.focus();
  };

  const displayValue = isFocused ? inputValue : cursorFontSize;

  return (
    <div className="bg-muted/60 flex h-7 items-center gap-1 rounded-md p-0">
      <ToolbarButton onClick={() => handleFontSizeChange(-1)}>
        <Minus />
      </ToolbarButton>

      <PopoverBase open={isFocused} modal={false}>
        <PopoverTrigger asChild>
          <input
            className={cn(
              'hover:bg-muted h-full w-10 shrink-0 bg-transparent px-1 text-center text-sm'
            )}
            value={displayValue}
            onBlur={() => {
              setIsFocused(false);
              handleInputChange();
            }}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setInputValue(toUnitLess(cursorFontSize));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleInputChange();
              }
            }}
            data-plate-focus="true"
            type="text"
          />
        </PopoverTrigger>
        <PopoverContent className="w-10 px-px py-1" onOpenAutoFocus={(e) => e.preventDefault()}>
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              className={cn(
                'hover:bg-accent data-[highlighted=true]:bg-accent flex h-8 w-full items-center justify-center text-sm'
              )}
              onClick={() => {
                tf.fontSize.addMark(`${size}px`);
                setIsFocused(false);
              }}
              data-highlighted={size === displayValue}
              type="button">
              {size}
            </button>
          ))}
        </PopoverContent>
      </PopoverBase>

      <ToolbarButton onClick={() => handleFontSizeChange(1)}>
        <Plus />
      </ToolbarButton>
    </div>
  );
}
