import type { ShareAssetType, ShareConfig, ShareRole } from '@buster/server-shared/share';
import React, { useMemo } from 'react';
import { useShareChat } from '@/api/buster_rest/chats';
import { useShareCollection } from '@/api/buster_rest/collections';
import { useShareDashboard } from '@/api/buster_rest/dashboards';
import { useShareMetric } from '@/api/buster_rest/metrics';
import { useShareReport } from '@/api/buster_rest/reports';
import { Button } from '@/components/ui/buttons';
import { InputSearchDropdown } from '@/components/ui/inputs/InputSearchDropdown';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useDebounce } from '@/hooks/useDebounce';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { isValidEmail } from '@/lib/email';
import { inputHasText } from '@/lib/text';
import { useGetUserToOrganization } from '../../../api/buster_rest/users';
import { AvatarUserButton } from '../../ui/avatar/AvatarUserButton';
import type { SelectItem } from '../../ui/select';
import { AccessDropdown } from './AccessDropdown';

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
    const { mutateAsync: onShareChat, isPending: isInvitingChat } = useShareChat();
    const { mutateAsync: onShareReport, isPending: isInvitingReport } = useShareReport();

    const [inputValue, setInputValue] = React.useState<string>('');

    const [defaultPermissionLevel, setDefaultPermissionLevel] =
      React.useState<ShareRole>('can_view');

    const debouncedInputValue = useDebounce(inputValue, { wait: 100 });
    const { data: usersData } = useGetUserToOrganization({
      user_name: debouncedInputValue,
      email: debouncedInputValue,
      page: 1,
      page_size: 5,
    });

    const disableSubmit = !inputHasText(inputValue) || !isValidEmail(inputValue);
    const isInviting =
      isInvitingMetric ||
      isInvitingDashboard ||
      isInvitingCollection ||
      isInvitingChat ||
      isInvitingReport;

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
          value: user.email,
        })) || []
      );
    }, [usersData]);

    const onChangeAccessDropdown = useMemoizedFn((level: ShareRole | null) => {
      if (level) setDefaultPermissionLevel(level);
    });

    const onSubmitNewEmail = async () => {
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
            avatar_url: user?.avatarUrl || null,
          },
        ],
      };

      if (assetType === 'metric_file') {
        await onShareMetric(payload);
      } else if (assetType === 'dashboard_file') {
        await onShareDashboard(payload);
      } else if (assetType === 'collection') {
        await onShareCollection(payload);
      } else if (assetType === 'chat') {
        await onShareChat(payload);
      } else if (assetType === 'report_file') {
        await onShareReport(payload);
      } else {
        const _exhaustiveCheck: never = assetType;
      }

      setInputValue('');
    };

    const onPressEnter = useMemoizedFn(() => {
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
          disabled={disableSubmit}
        >
          Invite
        </Button>
      </div>
    );
  }
);

ShareMenuInvite.displayName = 'ShareMenuInvite';
