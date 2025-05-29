import { type BusterShare, ShareAssetType, ShareRole } from '@/api/asset_interfaces';
import {
  useShareCollection,
  useUnshareCollection,
  useUpdateCollectionShare
} from '@/api/buster_rest/collections';
import {
  useShareDashboard,
  useUnshareDashboard,
  useUpdateDashboardShare
} from '@/api/buster_rest/dashboards';
import { useShareMetric, useUnshareMetric, useUpdateMetricShare } from '@/api/buster_rest/metrics';
import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { inputHasText } from '@/lib/text';
import { validate } from 'email-validator';
import React from 'react';
import { AccessDropdown } from './AccessDropdown';
import { IndividualSharePerson } from './IndividualSharePerson';
import { ShareMenuContentEmbed } from './ShareMenuContentEmbed';
import { ShareMenuContentPublish } from './ShareMenuContentPublish';
import type { ShareMenuTopBarOptions } from './ShareMenuTopBar';

export const ShareMenuContentBody: React.FC<{
  selectedOptions: ShareMenuTopBarOptions;
  onCopyLink: () => void;
  shareAssetConfig: BusterShare;
  assetId: string;
  assetType: ShareAssetType;
  canEditPermissions: boolean;
  className?: string;
}> = React.memo(
  ({
    onCopyLink,
    shareAssetConfig,
    selectedOptions,
    assetId,
    canEditPermissions,
    assetType,
    className = ''
  }) => {
    const Component = ContentRecord[selectedOptions];
    const individual_permissions = shareAssetConfig.individual_permissions;
    const publicly_accessible = shareAssetConfig.publicly_accessible;
    const publicExpirationDate = shareAssetConfig.public_expiry_date;
    const password = shareAssetConfig.public_password;

    return (
      <Component
        onCopyLink={onCopyLink}
        individual_permissions={individual_permissions}
        publicly_accessible={publicly_accessible}
        publicExpirationDate={publicExpirationDate}
        password={password}
        assetId={assetId}
        assetType={assetType}
        canEditPermissions={canEditPermissions}
        className={className}
      />
    );
  }
);
ShareMenuContentBody.displayName = 'ShareMenuContentBody';

const ShareMenuContentShare: React.FC<ShareMenuContentBodyProps> = React.memo(
  ({ canEditPermissions, assetType, individual_permissions, assetId, className }) => {
    const { mutateAsync: onShareMetric, isPending: isInvitingMetric } = useShareMetric();
    const { mutateAsync: onShareDashboard, isPending: isInvitingDashboard } = useShareDashboard();
    const { mutateAsync: onShareCollection, isPending: isInvitingCollection } =
      useShareCollection();
    const { mutateAsync: onUpdateMetricShare } = useUpdateMetricShare();
    const { mutateAsync: onUpdateDashboardShare } = useUpdateDashboardShare();
    const { mutateAsync: onUpdateCollectionShare } = useUpdateCollectionShare();
    const { mutateAsync: onUnshareMetric } = useUnshareMetric();
    const { mutateAsync: onUnshareDashboard } = useUnshareDashboard();
    const { mutateAsync: onUnshareCollection } = useUnshareCollection();
    const { openErrorMessage } = useBusterNotifications();

    const isInviting = isInvitingMetric || isInvitingDashboard || isInvitingCollection;

    const [inputValue, setInputValue] = React.useState<string>('');
    const [defaultPermissionLevel, setDefaultPermissionLevel] = React.useState<ShareRole>(
      ShareRole.CAN_VIEW
    );
    const disableSubmit = !inputHasText(inputValue) || !validate(inputValue);
    const hasIndividualPermissions = !!individual_permissions?.length;

    const onSubmitNewEmail = useMemoizedFn(async () => {
      const isValidEmail = validate(inputValue);
      if (!isValidEmail) {
        openErrorMessage('Invalid email address');
        return;
      }

      const isAlreadyShared = individual_permissions?.some(
        (permission) => permission.email === inputValue
      );

      if (isAlreadyShared) {
        openErrorMessage('Email already shared');
        return;
      }

      const payload: Parameters<typeof onShareMetric>[0] = {
        id: assetId,
        params: [
          {
            email: inputValue,
            role: defaultPermissionLevel
          }
        ]
      };

      if (assetType === ShareAssetType.METRIC) {
        await onShareMetric(payload);
      } else if (assetType === ShareAssetType.DASHBOARD) {
        await onShareDashboard(payload);
      } else if (assetType === ShareAssetType.COLLECTION) {
        await onShareCollection(payload);
      }

      setInputValue('');
    });

    const onUpdateShareRole = useMemoizedFn(async (email: string, role: ShareRole | null) => {
      if (role) {
        const payload: Parameters<typeof onUpdateMetricShare>[0] = {
          id: assetId,
          params: {
            users: [
              {
                email,
                role
              }
            ]
          }
        };
        if (assetType === ShareAssetType.METRIC) {
          await onUpdateMetricShare(payload);
        } else if (assetType === ShareAssetType.DASHBOARD) {
          await onUpdateDashboardShare(payload);
        } else if (assetType === ShareAssetType.COLLECTION) {
          await onUpdateCollectionShare(payload);
        }
      } else {
        const payload: Parameters<typeof onUnshareMetric>[0] = {
          id: assetId,
          data: [email]
        };
        if (assetType === ShareAssetType.METRIC) {
          await onUnshareMetric(payload);
        } else if (assetType === ShareAssetType.DASHBOARD) {
          await onUnshareDashboard(payload);
        } else if (assetType === ShareAssetType.COLLECTION) {
          await onUnshareCollection(payload);
        }
      }
    });

    const onChangeInputValue = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    });

    const onChangeAccessDropdown = useMemoizedFn((level: ShareRole | null) => {
      if (level) setDefaultPermissionLevel(level);
    });

    return (
      <div className={cn('flex flex-col space-y-2.5', className)}>
        {canEditPermissions && (
          <div className="flex h-full items-center space-x-2">
            <div className="relative flex w-full items-center">
              <Input
                className="w-full"
                placeholder="Invite others by email..."
                value={inputValue}
                onChange={onChangeInputValue}
                onPressEnter={onSubmitNewEmail}
                autoComplete="off"
              />

              {inputValue && (
                <AccessDropdown
                  showRemove={false}
                  className="absolute top-[50%] right-[10px] -translate-y-1/2"
                  shareLevel={defaultPermissionLevel}
                  onChangeShareLevel={onChangeAccessDropdown}
                  assetType={assetType}
                  disabled={false}
                />
              )}
            </div>
            <Button
              loading={isInviting}
              size={'tall'}
              onClick={onSubmitNewEmail}
              disabled={disableSubmit}>
              Invite
            </Button>
          </div>
        )}

        {hasIndividualPermissions && (
          <div className="flex flex-col space-y-2 overflow-hidden">
            {individual_permissions?.map((permission) => (
              <IndividualSharePerson
                key={permission.email}
                {...permission}
                onUpdateShareRole={onUpdateShareRole}
                assetType={assetType}
                disabled={!canEditPermissions || permission.role === ShareRole.OWNER}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);
ShareMenuContentShare.displayName = 'ShareMenuContentShare';

export interface ShareMenuContentBodyProps {
  onCopyLink: () => void;
  individual_permissions: BusterShare['individual_permissions'];
  publicly_accessible: boolean;
  publicExpirationDate: string | null | undefined;
  password: string | null | undefined;
  assetId: string;
  assetType: ShareAssetType;
  canEditPermissions: boolean;
  className: string;
}

const ContentRecord: Record<ShareMenuTopBarOptions, React.FC<ShareMenuContentBodyProps>> = {
  Share: ShareMenuContentShare,
  Embed: ShareMenuContentEmbed,
  Publish: ShareMenuContentPublish
};
