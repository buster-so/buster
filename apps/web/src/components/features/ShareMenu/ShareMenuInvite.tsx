import React, { useMemo } from 'react';
import { InputSearchDropdown } from '@/components/ui/inputs/InputSearchDropdown';
import type { ShareAssetType, ShareConfig, ShareRole } from '@buster/server-shared/share';
import { AccessDropdown } from './AccessDropdown';
import { Button } from '@/components/ui/buttons';
import { inputHasText } from '@/lib/text';
import { isValidEmail } from '@/lib/email';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useDebounce, useMemoizedFn } from '@/hooks';
import { useShareMetric } from '@/api/buster_rest/metrics';
import { useShareDashboard } from '@/api/buster_rest/dashboards';
import { useShareCollection } from '@/api/buster_rest/collections';
import { useGetUserToOrganization } from '../../../api/buster_rest/users';
import type { SelectItem } from '../../ui/select';
import { AvatarUserButton } from '../../ui/avatar/AvatarUserButton';

interface ShareMenuInviteProps {
  assetType: ShareAssetType;
  assetId: string;
  individualPermissions: ShareConfig['individual_permissions'];
}

export const ShareMenuInvite: React.FC<ShareMenuInviteProps> = React.memo(
  ({ individualPermissions, assetType, assetId }) => {
    const { openErrorMessage } = useBusterNotifications();

    const { mutateAsync: onShareMetric, isPending: isInvitingMetric } = useShareMetric();
    const { mutateAsync: onShareDashboard, isPending: isInvitingDashboard } = useShareDashboard();
    const { mutateAsync: onShareCollection, isPending: isInvitingCollection } =
      useShareCollection();

    const [inputValue, setInputValue] = React.useState<string>('');

    const [defaultPermissionLevel, setDefaultPermissionLevel] =
      React.useState<ShareRole>('can_view');

    const debouncedInputValue = useDebounce(inputValue, { wait: 100 });
    const { data: usersData } = useGetUserToOrganization({
      user_name: debouncedInputValue,
      email: debouncedInputValue,
      page: 1,
      page_size: 5
    });

    const disableSubmit = !inputHasText(inputValue) || !isValidEmail(inputValue);
    const isInviting = isInvitingMetric || isInvitingDashboard || isInvitingCollection;

    const options: SelectItem<string>[] = useMemo(() => {
      return (
        usersData?.data.map((user) => ({
          label: (
            <AvatarUserButton
              username={user.name}
              email={user.email}
              avatarUrl={user.avatarUrl}
              avatarSize={24}
              className="cursor-pointer p-0"
            />
          ),
          value: user.email
        })) || []
      );
    }, [usersData]);

    const onChangeAccessDropdown = useMemoizedFn((level: ShareRole | null) => {
      if (level) setDefaultPermissionLevel(level);
    });

    const onSubmitNewEmail = useMemoizedFn(async () => {
      const emailIsValid = isValidEmail(inputValue);
      if (!emailIsValid) {
        openErrorMessage('Invalid email address');
        return;
      }

      const isAlreadyShared = individualPermissions?.some(
        (permission) => permission.email === inputValue
      );

      if (isAlreadyShared) {
        openErrorMessage('Email already shared');
        return;
      }

      const user = usersData?.data.find((user) => user.email === inputValue);

      const payload: Parameters<typeof onShareMetric>[0] = {
        id: assetId,
        params: [
          {
            email: inputValue,
            role: defaultPermissionLevel,
            name: user?.name || '',
            avatar_url: user?.avatarUrl || null
          }
        ]
      };

      if (assetType === 'metric') {
        await onShareMetric(payload);
      } else if (assetType === 'dashboard') {
        await onShareDashboard(payload);
      } else if (assetType === 'collection') {
        await onShareCollection(payload);
      }

      setInputValue('');
    });

    const onPressEnter = useMemoizedFn((value: string) => {
      onSubmitNewEmail();
    });

    const onSelect = useMemoizedFn((value: string) => {
      const associatedUser = usersData?.data.find((user) => user.email === value);

      if (associatedUser) {
        setInputValue(associatedUser.email || '');
      } else {
        setInputValue(value);
      }
    });

    return (
      <div className="flex h-full items-center space-x-2">
        <div className="relative flex w-full items-center">
          <InputSearchDropdown
            options={options}
            onSelect={onSelect}
            onChange={setInputValue}
            onSearch={setInputValue}
            onPressEnter={onPressEnter}
            value={inputValue}
            placeholder="Invite others by email..."
            className="w-full"
          />

          {inputValue && (
            <AccessDropdown
              showRemove={false}
              className="absolute top-[50%] right-[10px] -translate-y-1/2"
              shareLevel={defaultPermissionLevel}
              onChangeShareLevel={onChangeAccessDropdown}
              assetType={assetType}
              disabled={false}
              type="user"
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
    );
  }
);

ShareMenuInvite.displayName = 'ShareMenuInvite';
