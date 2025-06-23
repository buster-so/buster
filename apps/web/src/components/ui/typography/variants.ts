import { cva } from 'class-variance-authority';

export const textColorVariants = cva('', {
  variants: {
    variant: {
      default: 'text-text-default',
      secondary: 'text-text-secondary',
      tertiary: 'text-text-tertiary',
      danger: 'text-text-danger',
      primary: 'text-text-primary',
      inherit: 'text-inherit',
      link: 'text-text-default hover:text-text-primary'
    }
  }
});
