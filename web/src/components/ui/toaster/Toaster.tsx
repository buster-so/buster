'use client';

import { CircleCheck, CircleWarning, CircleXmark } from '@/components/ui/icons/NucleoIconFilled';
import { useTheme } from 'next-themes';
import type React from 'react';
import { Toaster as ToasterSonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof ToasterSonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <ToasterSonner
      position="bottom-right"
      expand={false}
      visibleToasts={5}
      duration={3000}
      icons={{
        success: <CircleCheck />,
        error: <CircleXmark />,
        warning: <CircleWarning />
      }}
      swipeDirections={['right']}
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background! border !p-3 group-[.toaster]:text-foreground! group-[.toaster]:border-border! group-[.toaster]:shadow!',
          description: 'group-[.toast]:text-gray-light',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-border group-[.toast]:text-foreground',
          icon: 'mx-0! !flex !justify-center'
        }
      }}
      {...props}
    />
  );
};

export { Toaster };
