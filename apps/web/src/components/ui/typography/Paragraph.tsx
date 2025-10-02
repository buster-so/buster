import { cva, type VariantProps } from 'class-variance-authority';
import type React from 'react';
import { cn } from '@/lib/utils';
import { textColorVariants } from './variants';

const paragraphVariants = cva('', {
  variants: {
    size: {
      base: 'text-base',
      sm: 'text-sm',
      xs: 'text-xs',
      md: 'text-md',
      lg: 'text-lg',
    },
    lineHeight: {
      none: 'leading-[1]',
      sm: 'leading-1.5!',
      base: 'leading-1.5',
      md: 'leading-[1.4]',
      lg: 'leading-[1.5]',
    },
  },
});

type ParagraphProps = {
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLHeadingElement>;
  children: React.ReactNode;
  onCopy?: React.ClipboardEventHandler<HTMLHeadingElement>;
} & VariantProps<typeof textColorVariants> &
  VariantProps<typeof paragraphVariants>;

export const Paragraph: React.FC<ParagraphProps> = ({
  onClick,
  variant = 'default',
  size = 'base',
  children,
  className,
  style,
  lineHeight = 'base',
  onCopy,
}) => {
  return (
    <p
      className={cn(
        paragraphVariants({ size, lineHeight }),
        textColorVariants({ variant }),
        className
      )}
      style={style}
      onCopy={onCopy}
      onClick={onClick}
    >
      {children}
    </p>
  );
};

export default Paragraph;
