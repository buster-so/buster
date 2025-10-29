import React from 'react';
import type { ISidebarGroup, ISidebarList, SidebarProps } from './interfaces';
import { SidebarCollapsible } from './SidebarCollapsible';
import { SidebarContextProvider } from './SidebarContext';
import { SidebarFooter } from './SidebarFooter';
import { SidebarItem } from './SidebarItem';
import './sidebar-module.css';

export const Sidebar: React.FC<SidebarProps> = React.memo(
  ({ header, content, footer, useCollapsible = true, onCollapseClick }) => {
    return (
      <SidebarContextProvider onCollapseClick={onCollapseClick}>
        <div className="@container flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="mb-5 mt-4.5 px-3.5">{header}</div>

          {/* Scrollable Content */}
          <div className="sidebar-scroll-area flex flex-1 flex-col overflow-y-auto scrollbar scrollbar-thin">
            {/* Top scroll indicator - appears when scrolled down */}
            <div className="sidebar-scroll-indicator-top" />
            <div className="flex flex-col space-y-4.5 px-3.5 pb-3">
              {content.map((item) => (
                <ContentSelector key={item.id} content={item} useCollapsible={useCollapsible} />
              ))}
            </div>
            {/* Bottom scroll indicator - appears when content is scrollable */}
            <div className="sidebar-scroll-indicator-bottom" />
          </div>

          {/* Footer - always at bottom */}
          {(footer || useCollapsible) && (
            <div className="px-3.5">
              <SidebarFooter useCollapsible={useCollapsible}>{footer}</SidebarFooter>
            </div>
          )}
        </div>
      </SidebarContextProvider>
    );
  }
);

Sidebar.displayName = 'Sidebar';

const ContentSelector: React.FC<{
  content: SidebarProps['content'][number];
  useCollapsible: boolean;
}> = React.memo(({ content, useCollapsible }) => {
  if (isSidebarGroup(content)) {
    return <SidebarCollapsible {...content} useCollapsible={useCollapsible} />;
  }
  return <SidebarList {...content} />;
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
