import type React from 'react';
import { Toaster as ToasterSonner } from 'sonner';
import CircleCheck from '../icons/NucleoIconOutlined/circle-check';
import CircleWarning from '../icons/NucleoIconOutlined/circle-warning';
import CircleXmark from '../icons/NucleoIconOutlined/circle-xmark';

type ToasterProps = React.ComponentProps<typeof ToasterSonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <ToasterSonner
      position="bottom-right"
      expand={false}
      visibleToasts={5}
      duration={3000}
      icons={{
        success: <CircleCheck />,
        error: <CircleXmark />,
        warning: <CircleWarning />,
      }}
      swipeDirections={['right']}
      theme={'light'}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background border p-3 group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow',
          description: 'group-[.toast]:text-gray-light',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-border group-[.toast]:text-foreground',
          icon: 'ml-0 mr-1 !flex !justify-center',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
