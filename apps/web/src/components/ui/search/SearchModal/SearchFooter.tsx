import isEmpty from 'lodash/isEmpty';
import React from 'react';
import ArrowsOppositeDirectionY from '@/components/ui/icons/NucleoIconOutlined/arrows-opposite-direction-y';
import CommandIcon from '@/components/ui/icons/NucleoIconOutlined/command';
import ReturnKey from '@/components/ui/icons/NucleoIconOutlined/return-key';
import { Button, type ButtonProps } from '../../buttons';
import type { SearchModalContentProps } from './search-modal.types';

export const SearchFooter = React.memo(
  (props: NonNullable<SearchModalContentProps['footerConfig'] | undefined>) => {
    const hasFooterConfig = !isEmpty(props);

    const footerItems = !hasFooterConfig
      ? [
          {
            type: 'div' as const,
            text: 'Select',
            icons: [<ArrowsOppositeDirectionY key="arrows-opposite-direction-y" />],
          },
          {
            type: 'div' as const,
            text: 'Open',
            icons: [<ReturnKey key="return-key" />],
          },
          {
            type: 'div' as const,
            text: 'Open in new tab',
            icons: [<CommandIcon key="command-icon" />, <ReturnKey key="return-key" />],
          },
        ]
      : ([
          {
            type: 'button' as const,
            side: 'left',
            ...props?.tertiaryButton,
          },
          {
            type: 'button' as const,
            side: 'right',
            ...props?.secondaryButton,
          },
          {
            type: 'button' as const,
            side: 'right',
            ...props?.primaryButton,
          },
        ].filter((v) => !!v.children) as React.ComponentProps<typeof FooterItem>[]);

    const leftItems = footerItems.filter((item) => item.type === 'div' || item.side === 'left');
    const rightItems = footerItems.filter(
      (item) => item.type === 'button' && item.side === 'right'
    );

    return (
      <div className="flex justify-between border-t min-h-12 items-center px-6">
        <div className="flex space-x-4.5 items-center">
          {leftItems.map((item, index) => (
            <FooterItem key={`left-${index}`} {...item} />
          ))}
        </div>
        <div className="flex space-x-2 items-center">
          {rightItems.map((item, index) => (
            <FooterItem key={`right-${index}`} {...item} />
          ))}
        </div>
      </div>
    );
  }
);

const FooterItem = (
  props:
    | {
        text: string;
        icons: React.ReactNode[];
        type: 'div';
      }
    | (ButtonProps & {
        type: 'button';
        side?: 'left' | 'right';
      })
) => {
  const { type } = props;
  if (type === 'button') {
    const { side, ...buttonProps } = props;
    return <Button {...buttonProps}>{buttonProps.children}</Button>;
  }

  const { text, icons } = props;

  return (
    <div className="text-xs text-gray-light space-x-1 flex items-center justify-between hover:text-foreground transition-all duration-100">
      <div className="flex items-center space-x-0.5">
        {icons.map((icon, index) => (
          <div key={index}>{icon}</div>
        ))}
      </div>
      <span className="leading-none">{text}</span>
    </div>
  );
};
