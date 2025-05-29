import React from 'react';
import { SidebarCollapsible } from './SidebarCollapsible';
import { SidebarItem } from './SidebarItem';
import type { ISidebarGroup, ISidebarList, SidebarProps } from './interfaces';

export const Sidebar: React.FC<SidebarProps> = React.memo(({ header, content, footer }) => {
  return (
    <div className="flex h-full flex-col overflow-hidden px-3.5 pt-4.5">
      <div className="flex flex-col space-y-4.5 overflow-hidden">
        <div className="mb-5"> {header}</div>
        <div className="flex flex-grow flex-col space-y-4.5 overflow-y-auto pb-3">
          {content.map((item) => (
            <ContentSelector key={item.id} content={item} />
          ))}
        </div>
      </div>
      {footer && <div className="mt-auto mb-2 overflow-hidden pt-5">{footer}</div>}
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

const ContentSelector: React.FC<{
  content: SidebarProps['content'][number];
}> = React.memo(({ content }) => {
  if (isSidebarGroup(content)) {
    return <SidebarCollapsible {...content} />;
  }

  return <SidebarList items={content.items} />;
});
ContentSelector.displayName = 'ContentSelector';

const SidebarList: React.FC<{
  items: ISidebarList['items'];
}> = ({ items }) => {
  return (
    <div className="flex flex-col space-y-0.5">
      {items.map((item) => (
        <SidebarItem key={item.id} {...item} />
      ))}
    </div>
  );
};

const isSidebarGroup = (content: SidebarProps['content'][number]): content is ISidebarGroup => {
  return 'label' in content && content.label !== undefined;
};
