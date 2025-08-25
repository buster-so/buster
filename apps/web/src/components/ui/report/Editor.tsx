import {
  PlateContent,
  PlateView,
  type PlateContentProps,
  type PlateViewProps
} from 'platejs/react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

const editorVariants = cva(
  cn(
    'group/editor',
    'relative w-full cursor-text overflow-x-visible break-words whitespace-pre-wrap select-text',
    'ring-offset-background focus-visible:outline-none',
    'placeholder:text-muted-foreground/80 **:data-slate-placeholder:!top-1/2 **:data-slate-placeholder:-translate-y-1/2 **:data-slate-placeholder:text-muted-foreground/80 **:data-slate-placeholder:opacity-100!',
    '[&_strong]:font-bold'
  ),
  {
    defaultVariants: {
      variant: 'default'
    },
    variants: {
      readOnly: {
        true: ''
      },
      focused: {
        true: 'ring-2 ring-ring ring-offset-2'
      },
      variant: {
        comment: cn('rounded-none border-none bg-transparent text-sm'),
        default: 'px-16 pt-4 pb-72 text-base sm:px-[max(64px,calc(50%-350px))]',
        fullWidth: 'px-16 pt-4 pb-72 text-base sm:px-24',
        none: ''
      }
    }
  }
);

export type EditorProps = PlateContentProps & VariantProps<typeof editorVariants>;

export const Editor = React.forwardRef<HTMLDivElement, EditorProps>(
  ({ className, disabled, focused, variant, readOnly, ...props }, ref) => {
    return (
      <PlateContent
        ref={ref}
        className={cn(
          editorVariants({
            readOnly,
            focused,
            variant
          }),
          className
        )}
        readOnly={readOnly}
        disableDefaultStyles={true}
        {...props}
      />
    );
  }
);

Editor.displayName = 'Editor';

export function EditorView({
  className,
  variant,
  ...props
}: PlateViewProps & VariantProps<typeof editorVariants>) {
  return <PlateView {...props} className={cn(editorVariants({ variant }), className)} />;
}

EditorView.displayName = 'EditorView';
