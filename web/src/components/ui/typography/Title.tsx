import { cn } from '@/lib/classMerge';
import { cva, type VariantProps } from 'class-variance-authority';
import type React from 'react';
import { textColorVariants } from './variants';

const titleVariants = cva('', {
  variants: {
    size: {
      h1: 'text-4xl font-normal! ',
      h2: 'text-2xl font-normal!',
      h3: 'text-xl font-normal!',
      h4: 'text-lg font-normal!',
      h5: 'text-md font-normal!'
    },
    truncate: {
      true: 'truncate',
      false: ''
    }
  },
  defaultVariants: {
    size: 'h4'
  }
});

type TitleLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5';

type TitleProps = {
  as?: TitleLevel;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLHeadingElement>;
  children: React.ReactNode;
} & VariantProps<typeof titleVariants> &
  VariantProps<typeof textColorVariants>;

export const Title: React.FC<TitleProps> = ({
  as = 'h1',
  variant = 'default',
  size,
  truncate,
  className,
  style,
  onClick,
  children
}) => {
  // If size is not explicitly set, use the heading level as the size
  const effectiveSize = size || as;
  const Component = as;

  return (
    <Component
      style={style}
      className={cn(
        titleVariants({ size: effectiveSize, truncate }),
        textColorVariants({ variant }),
        className
      )}
      onClick={onClick}>
      {children}
    </Component>
  );
};

export default Title;
