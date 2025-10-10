import React from 'react';
import ArrowsOppositeDirectionY from '@/components/ui/icons/NucleoIconOutlined/arrows-opposite-direction-y';
import CommandIcon from '@/components/ui/icons/NucleoIconOutlined/command';
import ReturnKey from '@/components/ui/icons/NucleoIconOutlined/return-key';

export const SearchFooter: React.FC = React.memo(() => {
  const footerItems = [
    {
      text: 'Select',
      icons: [<ArrowsOppositeDirectionY key="arrows-opposite-direction-y" />],
    },
    {
      text: 'Open',
      icons: [<ReturnKey key="return-key" />],
    },
    {
      text: 'Open in new tab',
      icons: [<CommandIcon key="command-icon" />, <ReturnKey key="return-key" />],
    },
  ];

  return (
    <div className="flex space-x-4.5 border-t min-h-12 items-center px-6">
      {footerItems.map((item, index) => (
        <FooterItem key={index} text={item.text} icons={item.icons} />
      ))}
    </div>
  );
});

const FooterItem = ({ text, icons }: { text: string; icons: React.ReactNode[] }) => {
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
