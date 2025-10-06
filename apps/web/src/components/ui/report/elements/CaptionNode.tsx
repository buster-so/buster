import {
  CaptionPlugin,
  Caption as CaptionPrimitive,
  CaptionTextarea as CaptionTextareaPrimitive,
  useCaptionButtonState,
} from '@platejs/caption/react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { TElement } from 'platejs';
import { usePluginOption } from 'platejs/react';
import type * as React from 'react';
import { Button } from '@/components/ui/buttons';
import { cn } from '@/lib/utils';
import { NodeTypeLabels } from '../config/labels';

const captionVariants = cva('max-w-full text-[13px] text-gray-dark', {
  defaultVariants: {
    align: 'center',
  },
  variants: {
    align: {
      center: 'mx-auto',
      left: 'mr-auto',
      right: 'ml-auto',
    },
  },
});

export function Caption({
  align,
  className,
  ...props
}: React.ComponentProps<typeof CaptionPrimitive> & VariantProps<typeof captionVariants>) {
  return <CaptionPrimitive {...props} className={cn(captionVariants({ align }), className)} />;
}

export function CaptionTextarea(props: React.ComponentProps<typeof CaptionTextareaPrimitive>) {
  return (
    <CaptionTextareaPrimitive
      {...props}
      className={cn(
        'mt-2 w-full resize-none border-none bg-inherit p-0 font-[inherit] text-inherit',
        'focus:outline-none focus:[&::placeholder]:opacity-0',
        'text-center print:placeholder:text-transparent',
        props.className
      )}
    />
  );
}

export const CaptionButton = (props: React.ComponentProps<typeof Button>) => {
  const captionButtonState = useCaptionButtonState();
  const visibleId = usePluginOption(CaptionPlugin, 'visibleId');
  const element = captionButtonState.element;
  const isOpen = visibleId === element.id;
  const hasCaption = (captionButtonState.element?.caption as TElement[]) !== undefined || isOpen;
  const text = hasCaption ? NodeTypeLabels.removeCaption.label : NodeTypeLabels.addCaption.label;
  const editor = captionButtonState.editor;

  const addCaption = () => {
    const path = editor.api.findPath(element);
    editor.setOption(CaptionPlugin, 'visibleId', element.id as string);
    setTimeout(() => {
      path && editor.setOption(CaptionPlugin, 'focusEndPath', path);
    }, 0);
  };

  const removeCaption = () => {
    editor.tf.unsetNodes('caption', { at: element });
    editor.setOption(CaptionPlugin, 'visibleId', null);
  };

  const onClick = () => {
    if (hasCaption) {
      removeCaption();
    } else {
      addCaption();
    }
  };

  return (
    <Button variant={'default'} {...props} {...captionButtonState} onClick={onClick}>
      {text}
    </Button>
  );
};
