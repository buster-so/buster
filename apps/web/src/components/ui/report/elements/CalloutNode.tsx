'use client';

import * as React from 'react';

import { useCalloutEmojiPicker } from '@platejs/callout/react';
import { useEmojiDropdownMenuState } from '@platejs/emoji/react';
import { PlateElement } from 'platejs/react';
import type { PlateElementProps } from 'platejs/react';

import { Button } from '@/components/ui/buttons';
import { cn } from '@/lib/utils';

import { EmojiPicker, EmojiPopover } from './EmojiToolbarButton';
import type { TCalloutElement } from 'platejs';

export function CalloutElement({
  attributes,
  children,
  ...props
}: PlateElementProps<TCalloutElement>) {
  const { emojiPickerState, isOpen, setIsOpen } = useEmojiDropdownMenuState({
    closeOnSelect: true
  });

  const { emojiToolbarDropdownProps, props: calloutProps } = useCalloutEmojiPicker({
    isOpen,
    setIsOpen
  });

  return (
    <PlateElement
      className={cn('bg-muted flex rounded-sm p-4 pl-3', attributes.className)}
      style={{
        ...attributes.style,
        backgroundColor: props.element.backgroundColor
      }}
      attributes={{
        ...attributes,
        'data-plate-open-context-menu': true
      }}
      {...props}>
      <div className="flex w-full gap-2 rounded-md">
        <EmojiPopover
          {...emojiToolbarDropdownProps}
          control={
            <Button
              variant="ghost"
              size="tall"
              className="hover:bg-muted-foreground/15 size-6 max-h-none p-1 text-[18px] select-none"
              style={{
                fontFamily:
                  '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols'
              }}
              prefix={<div className="text-lg">{(props.element.icon || '💡').trim()}</div>}
              contentEditable={false}
            />
          }>
          <EmojiPicker {...emojiPickerState} {...calloutProps} />
        </EmojiPopover>
        <div className="mt-0.5 w-full">{children}</div>
      </div>
    </PlateElement>
  );
}
