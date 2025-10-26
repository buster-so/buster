import React from 'react';
import {
  PopoverRoot as PopoverBase,
  PopoverContent,
  type PopoverContentVariant,
  PopoverTrigger,
  type PopoverTriggerType,
} from './PopoverBase';

export interface PopoverProps
  extends React.ComponentProps<typeof PopoverBase>,
    Pick<
      React.ComponentProps<typeof PopoverContent>,
      'align' | 'side' | 'onOpenAutoFocus' | 'disablePortal'
    > {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  trigger?: PopoverTriggerType;
  size?: PopoverContentVariant['size'];
  sideOffset?: number;
  modal?: boolean;
}

export const Popover = React.memo<PopoverProps>(
  ({
    children,
    content,
    align,
    side,
    className = '',
    trigger = 'click',
    size = 'default',
    sideOffset,
    onOpenAutoFocus,
    modal,
    disablePortal,
    ...props
  }) => {
    return (
      <PopoverBase trigger={trigger} modal={modal} {...props}>
        <PopoverTrigger asChild>
          <span className="">{children}</span>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          side={side}
          className={className}
          size={size}
          sideOffset={sideOffset}
          onOpenAutoFocus={onOpenAutoFocus}
          disablePortal={disablePortal}
        >
          {content}
        </PopoverContent>
      </PopoverBase>
    );
  }
);

Popover.displayName = 'Popover';
