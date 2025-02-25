import React, { useMemo, useRef } from 'react';
import { AppSidebarTopItems } from './AppSidebarTopItems';
import { AppSidebarSettings } from './AppSidebarSettings';
import { AppSidebarPrimary } from './AppSidebarPrimary';
import { useMemoizedFn, useScroll } from 'ahooks';
import { AppSidebarTopSettings } from './AppSidebarTopSettings';
import { useUserConfigContextSelector } from '@/context/Users';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { AppSidebarInternal } from './AppSidebarInternal';
import { BusterRoutes } from '@/routes';
import { AppSidebarTopInternal } from './AppSidebarTopInternal';

const SidebarRecord = {
  [BusterRoutes.SETTINGS]: AppSidebarSettings,
  [BusterRoutes.APP_INTERNAL]: AppSidebarInternal,
  DEFAULT: AppSidebarPrimary
};

const SidebarTopRecord = {
  [BusterRoutes.SETTINGS]: AppSidebarTopSettings,
  [BusterRoutes.APP_INTERNAL]: AppSidebarTopInternal,
  DEFAULT: AppSidebarTopItems
};

const memoizedStyle = {
  marginTop: 18
};

export const AppSidebar: React.FC<{
  minDragWidth?: number;
  maxDragWidth?: number;
  className?: string;
  signOut: () => void;
}> = React.memo(({ className = '', signOut }) => {
  const onToggleThreadsModal = useAppLayoutContextSelector((s) => s.onToggleThreadsModal);
  const createPageLink = useAppLayoutContextSelector((s) => s.createPageLink);
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const currentSegment = useAppLayoutContextSelector((s) => s.currentSegment);
  const openThreadsModal = useAppLayoutContextSelector((s) => s.openThreadsModal);
  const isUserRegistered = useUserConfigContextSelector((state) => state.isUserRegistered);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isScrolledSidebar = (useScroll(sidebarRef)?.top || 0) > 0;

  const isSettings = currentSegment === 'settings';
  const isInternal = currentSegment === 'internal';
  const ChosenSidebar = useMemo(() => {
    if (isInternal) {
      return SidebarRecord[BusterRoutes.APP_INTERNAL];
    }
    if (isSettings) {
      return SidebarRecord[BusterRoutes.SETTINGS];
    }
    return SidebarRecord['DEFAULT'];
  }, [isSettings, isInternal]);

  const ChosenTopBar = useMemo(() => {
    if (isInternal) {
      return SidebarTopRecord[BusterRoutes.APP_INTERNAL];
    }
    if (isSettings) {
      return SidebarTopRecord[BusterRoutes.SETTINGS];
    }
    return SidebarTopRecord['DEFAULT'];
  }, [isSettings, isInternal]);

  const onGoToSettingPage = useMemoizedFn(() => {
    onChangePage({
      route: BusterRoutes.SETTINGS_GENERAL
    });
  });

  const onGoToHomePage = useMemoizedFn(() => {
    onChangePage({
      route: BusterRoutes.APP_COLLECTIONS
    });
  });

  const memoizedSidebarStyle = useMemo(() => {
    return {
      boxShadow: isScrolledSidebar ? 'inset rgb(0 0 0 / 4%) 0px 3px 2px 0px' : 'none'
    };
  }, [isScrolledSidebar]);

  return (
    <div className={`${className} flex h-full flex-col overflow-hidden`}>
      <ChosenTopBar
        onOpenSettings={onGoToSettingPage}
        onGoToHomePage={onGoToHomePage}
        onOpenThreadsModal={onToggleThreadsModal}
        createPageLink={createPageLink}
        threadModalOpen={openThreadsModal}
        isUserRegistered={isUserRegistered}
        className="mb-5 px-3.5"
        style={memoizedStyle}
      />

      <div
        className="h-full overflow-y-auto px-3.5 pb-4"
        ref={sidebarRef}
        style={memoizedSidebarStyle}>
        <ChosenSidebar signOut={signOut} />
      </div>
    </div>
  );
});
AppSidebar.displayName = 'AppSidebar';
