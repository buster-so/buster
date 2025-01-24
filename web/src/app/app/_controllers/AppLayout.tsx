'use client';

import { ConfigProvider, Layout } from 'antd';
import React, { PropsWithChildren, useMemo } from 'react';
import { AppSidebar } from './AppSidebar';
import { NewThreadModal } from '../_components/NewThreadModal';
import { InvitePeopleModal } from '../_components/InvitePeopleModal';
import { AppSplitter } from '@/components/layout';
import { createStyles } from 'antd-style';
import { useBusterStylesContext } from '@/context/BusterStyles/BusterStyles';
import { useUserConfigContextSelector } from '@/context/Users';
import { SupportModal } from '../_components/SupportModal';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from 'ahooks';
import { ThemeConfig } from 'antd/lib';
import { TempNetworkVisibility } from './_TempNetworkVisibility';
import { useSearchParams } from 'next/navigation';

const layoutStyle = {
  overflow: 'hidden',
  minHeight: '100vh'
};

export const AppLayout: React.FC<
  PropsWithChildren<{
    defaultLayout: (number | string)[];
    signOut: () => void;
  }>
> = ({ defaultLayout, children, signOut }) => {
  const searchParams = useSearchParams();
  const isAnonymousUser = useUserConfigContextSelector((state) => state.isAnonymousUser);
  const hideSidePanel = isAnonymousUser;
  const embedView = searchParams.get('embed') === 'true';

  return (
    <AppSplitter
      defaultLayout={defaultLayout}
      autoSaveId="app-layout"
      preserveSide="left"
      splitterClassName={''}
      leftPanelMinSize={'190px'}
      leftPanelMaxSize={'300px'}
      hideSplitter={true}
      style={layoutStyle}
      leftHidden={hideSidePanel}
      leftChildren={<AppSidebar signOut={signOut} />}
      rightChildren={
        <AppLayoutContent
          isAnonymousUser={isAnonymousUser}
          hideSidePanel={hideSidePanel}
          embedView={embedView}>
          {children}
        </AppLayoutContent>
      }
    />
  );
};

const useStyles = createStyles(({ css, token }) => {
  return {
    layout: css`
      border: 0.5px solid ${token.colorBorder};
      min-height: calc(100vh - 16px);
      height: calc(100vh - 16px);
      max-height: calc(100vh - 16px);
    `
  };
});

const AppLayoutContent: React.FC<
  PropsWithChildren<{
    hideSidePanel: boolean;
    isAnonymousUser: boolean;
    embedView?: boolean;
  }>
> = React.memo(({ children, isAnonymousUser, hideSidePanel, embedView }) => {
  const { cx, styles } = useStyles();
  const onToggleInviteModal = useAppLayoutContextSelector((s) => s.onToggleInviteModal);
  const openInviteModal = useAppLayoutContextSelector((s) => s.openInviteModal);
  const onToggleThreadsModal = useAppLayoutContextSelector((s) => s.onToggleThreadsModal);
  const openThreadsModal = useAppLayoutContextSelector((s) => s.openThreadsModal);
  const onToggleSupportModal = useAppLayoutContextSelector((s) => s.onToggleSupportModal);
  const openSupportModal = useAppLayoutContextSelector((s) => s.openSupportModal);
  const userOrganizations = useUserConfigContextSelector((x) => x.userOrganizations);
  const colorBgContainerDisabled = useBusterStylesContext(
    (s) => s.theme.token?.colorBgContainerDisabled
  );

  const onCloseThreadsModal = useMemoizedFn(() => onToggleThreadsModal(false));
  const onCloseInviteModal = useMemoizedFn(() => onToggleInviteModal(false));
  const onCloseSupportModal = useMemoizedFn(() => onToggleSupportModal(false));

  const hasOrganization = !!userOrganizations;

  const themeConfig = useMemo<ThemeConfig>(
    () => ({
      components: {
        Layout: {
          bodyBg: colorBgContainerDisabled
        }
      }
    }),
    [colorBgContainerDisabled]
  );

  const layoutClassName = useMemo(
    () =>
      embedView
        ? ''
        : cx(`mr-2 mt-2 overflow-hidden rounded-md`, styles.layout, {
            'ml-2': hideSidePanel
          }),
    [embedView, hideSidePanel, styles.layout]
  );

  return (
    <ConfigProvider theme={themeConfig}>
      <Layout className={layoutClassName}>{children}</Layout>

      {!isAnonymousUser && hasOrganization && (
        <>
          <NewThreadModal open={openThreadsModal} onClose={onCloseThreadsModal} />
          <InvitePeopleModal open={openInviteModal} onClose={onCloseInviteModal} />
          <SupportModal open={openSupportModal} onClose={onCloseSupportModal} />
        </>
      )}
      <TempNetworkVisibility />
    </ConfigProvider>
  );
});
AppLayoutContent.displayName = 'AppLayoutContent';
