'use client';

import React, { useRef, useState } from 'react';
import type { ISidebarGroup, ISidebarList, SidebarProps } from './interfaces';
import { SidebarCollapsible } from './SidebarCollapsible';
import { SidebarItem } from './SidebarItem';
import { SidebarFooter } from './SidebarFooter';
import { useMemoizedFn } from '@/hooks';
import { useAppSplitterContext } from '../layouts/AppSplitterOld/AppSplitterProvider';
import { COLLAPSED_SIDEBAR_WIDTH, DEFAULT_SIDEBAR_WIDTH } from './config';

export const Sidebar: React.FC<SidebarProps> = React.memo(
  ({ header, content, footer, useCollapsible = true, onCollapseClick }) => {
    const animateWidth = useAppSplitterContext((x) => x.animateWidth);
    const getSizesInPixels = useAppSplitterContext((x) => x.getSizesInPixels);

    const onCollapseClickPreflight = useMemoizedFn(() => {
      const sizes = getSizesInPixels();
      const parsedCollapsedWidth = parseInt(COLLAPSED_SIDEBAR_WIDTH) + 6; //6 for a little buffer
      const parsedCurrentSize = sizes[0];
      const isCollapsed = parsedCurrentSize <= parsedCollapsedWidth;
      onCollapseClick?.(isCollapsed);
      const targetWidth = !isCollapsed ? COLLAPSED_SIDEBAR_WIDTH : DEFAULT_SIDEBAR_WIDTH;
      animateWidth(targetWidth, 'left', 0.15);
    });

    return (
      <div className="@container flex h-full flex-col overflow-hidden px-3.5 pt-4.5">
        <div className="flex flex-col space-y-4.5 overflow-hidden">
          <div className="mb-5">{header}</div>
          <div className="flex flex-grow flex-col space-y-4.5 overflow-y-auto pb-3">
            {content.map((item) => (
              <ContentSelector key={item.id} content={item} useCollapsible={useCollapsible} />
            ))}
          </div>
        </div>
        {(footer || useCollapsible) && (
          <SidebarFooter useCollapsible={useCollapsible} onCollapseClick={onCollapseClickPreflight}>
            {footer}
          </SidebarFooter>
        )}
      </div>
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
