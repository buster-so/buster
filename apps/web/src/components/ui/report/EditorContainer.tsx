import { cn } from '@/lib/utils';
import { PlateContainer } from 'platejs/react';
import { cva, type VariantProps } from 'class-variance-authority';

interface EditorContainerProps {
  className?: string;
  variant?: 'default' | 'comment';
  readonly?: boolean;
  disabled?: boolean;
}

const editorContainerVariants = cva(
  'relative w-full cursor-text bg-transparent caret-primary select-text selection:bg-brand/25 focus-visible:outline-none [&_.slate-selection-area]:z-50 [&_.slate-selection-area]:border [&_.slate-selection-area]:border-brand/25 [&_.slate-selection-area]:bg-brand/15',

  {
    variants: {
      variant: {
        default: ' h-full',
        comment: cn(
          'flex flex-wrap justify-between gap-1 px-1 py-0.5 text-sm',
          'rounded-md border-[1.5px] border-transparent bg-transparent',
          'has-[[data-slate-editor]:focus]:border-brand/50 has-[[data-slate-editor]:focus]:ring-2 has-[[data-slate-editor]:focus]:ring-brand/30',
          'has-aria-disabled:border-input has-aria-disabled:bg-muted'
        ),
        select: cn(
          'group rounded-md border border-input ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          'has-data-readonly:w-fit has-data-readonly:cursor-default has-data-readonly:border-transparent has-data-readonly:focus-within:[box-shadow:none]'
        )
      },
      readonly: {
        true: 'cursor-text'
      }
    },
    defaultVariants: {
      variant: 'default',
      readonly: false
    }
  }
);

export function EditorContainer({
  className,
  variant,
  disabled,
  readonly,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof editorContainerVariants> &
  EditorContainerProps) {
  return (
    <PlateContainer
      className={cn(
        'ignore-click-outside/toolbar overflow-y-auto',
        editorContainerVariants({ variant, readonly }),
        className
      )}
      {...props}
    />
  );
}
