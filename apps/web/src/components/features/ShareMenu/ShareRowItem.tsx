import type { ShareAssetType, ShareRole, WorkspaceShareRole } from '@buster/server-shared/share';
import React from 'react';
import { AvatarUserButton } from '../../ui/avatar/AvatarUserButton';
import { AccessDropdown } from './AccessDropdown';

type ShareRowItemBaseProps = {
  primary: string | null | undefined;
  secondary: string | undefined;
  avatar?: string | null | React.ReactNode;
  disabled?: boolean;
  assetType: ShareAssetType;
};

type ShareRowItemUserProps = {
  type: 'user';
  role: ShareRole;
  showRemove?: boolean;
  shareLevel: ShareRole | null;
  onChangeShareLevel?: (role: ShareRole | null) => void;
};

type ShareRowItemWorkspaceProps = {
  type: 'workspace';
  role: WorkspaceShareRole;
  shareLevel: WorkspaceShareRole | null;
  onChangeShareLevel?: (role: WorkspaceShareRole | null) => void;
};

type ShareRowItemProps = ShareRowItemBaseProps &
  (ShareRowItemUserProps | ShareRowItemWorkspaceProps);

export const ShareRowItem: React.FC<ShareRowItemProps> = ({
  primary,
  secondary,
  avatar,
  disabled = false,
  assetType,
  ...props
}) => {
  return (
    <div
      className="flex h-8 items-center justify-between space-x-2 overflow-hidden"
      data-testid={`share-row-${primary || secondary}`}>
      <AvatarUserButton username={primary} email={secondary} avatarUrl={avatar} avatarSize={24} />

      <AccessDropdown disabled={disabled} assetType={assetType} {...props} />
    </div>
  );
};
