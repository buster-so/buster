'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { useToggleButton, useToggleButtonState } from '@platejs/toggle/react';
import { ChevronRight } from '@/components/ui/icons';
import { PlateElement } from 'platejs/react';

import { Button } from '@/components/ui/buttons';
import { cn } from '@/lib/classMerge';

export function ToggleElement(props: PlateElementProps) {
  const element = props.element;
  const state = useToggleButtonState(element.id as string);
  const { buttonProps, open } = useToggleButton(state);

  return (
    <PlateElement {...props} className="pl-6">
      <Button
        variant="ghost"
        className="text-muted-foreground hover:bg-accent absolute top-0 -left-0.5 size-6 cursor-pointer items-center justify-center rounded-md p-px transition-colors select-none [&_svg]:size-4"
        contentEditable={false}
        {...buttonProps}
        prefix={
          <div className={cn('transition-transform duration-75', open ? 'rotate-90' : 'rotate-0')}>
            <ChevronRight />
          </div>
        }></Button>
      {props.children}
    </PlateElement>
  );
}
