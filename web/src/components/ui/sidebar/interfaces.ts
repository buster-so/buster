import type React from 'react';

export interface ISidebarItem {
  label: string;
  icon?: React.ReactNode;
  route: string | null;
  id: string;
  disabled?: boolean;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}

export interface ISidebarGroup {
  label: string;
  icon?: React.ReactNode;
  id: string;
  items: ISidebarItem[];
  variant?: 'collapsible' | 'icon'; //default is collapsible
  defaultOpen?: boolean; //will default to true
  isSortable?: boolean;
  onItemsReorder?: (ids: string[]) => void;
}

export interface ISidebarList {
  items: ISidebarItem[];
  id: string;
}

type SidebarContent = ISidebarGroup | ISidebarList;

export interface SidebarProps {
  header: React.ReactNode;
  content: SidebarContent[];
  footer?: React.ReactNode;
  isSortable?: boolean;
  useCollapsible?: boolean;
  isDefaultCollapsed?: boolean;
  onCollapseClick?: (value: boolean) => void;
}
