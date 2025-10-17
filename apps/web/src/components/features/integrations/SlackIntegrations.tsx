import React, { useMemo } from 'react';

type SlackSharingPermission = 'shareWithWorkspace' | 'shareWithChannel' | 'noSharing';

import pluralize from 'pluralize';
import {
  useGetSlackChannels,
  useGetSlackIntegration,
  useInitiateSlackOAuth,
  useRemoveSlackIntegration,
  useUpdateSlackIntegration,
} from '@/api/buster_rest/slack/queryRequests';
import { Button } from '@/components/ui/buttons';
import { StatusCard } from '@/components/ui/card/StatusCard';
import {
  createDropdownItems,
  Dropdown,
  type IDropdownItem,
  type IDropdownItems,
} from '@/components/ui/dropdown';
import { ChevronDown } from '@/components/ui/icons';
import { SlackIcon } from '@/components/ui/icons/customIcons/SlackIcon';
import LinkSlash from '@/components/ui/icons/NucleoIconOutlined/link-slash';
import Refresh from '@/components/ui/icons/NucleoIconOutlined/refresh';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { SettingCardContent, SettingsCards } from '../settings/SettingsCard';
import { IntegrationSkeleton } from './IntegrationSkeleton';

export const SlackIntegrations = React.memo(() => {
  const {
    data: slackIntegration,
    isFetched: isFetchedSlackIntegration,
    error: slackIntegrationError,
  } = useGetSlackIntegration();

  const isConnected = slackIntegration?.connected ?? false;

  const cards = useMemo(() => {
    const sections = [
      <ConnectSlackCard key="connect-slack-card" />,
      isConnected && <ConnectedSlackChannels key="connected-slack-channels" />,
      isConnected && <SlackSharingPermissions key="slack-sharing-permissions" />,
    ].filter(Boolean);
    return [{ sections }];
  }, [isConnected]);

  if (slackIntegrationError) {
    return <StatusCard message="Error fetching Slack integration." variant={'danger'} />;
  }

  if (!isFetchedSlackIntegration) {
    return <IntegrationSkeleton />;
  }

  return <SettingsCards title="Slack" description="Connect Buster with Slack" cards={cards} />;
});

SlackIntegrations.displayName = 'SlackIntegrations';

const ConnectSlackCard = React.memo(() => {
  const { data: slackIntegration } = useGetSlackIntegration();
  const { mutate: initiateSlackOAuth } = useInitiateSlackOAuth();

  const isConnected = slackIntegration?.connected;
  const needsReinstall = slackIntegration?.status === 're_install_required';

  return (
    <SettingCardContent
      title="Slack account"
      description="Link your Slack account to use Buster from Slack"
      icon={<SlackIcon size={16} />}
    >
      {isConnected ? (
        needsReinstall ? (
          <Button
            prefix={<SlackIcon size={16} />}
            onClick={() => initiateSlackOAuth()}
            size={'tall'}
          >
            Re-install Required
          </Button>
        ) : (
          <ConnectedDropdown />
        )
      ) : (
        <Button prefix={<SlackIcon size={16} />} onClick={() => initiateSlackOAuth()} size={'tall'}>
          Connect Slack
        </Button>
      )}
    </SettingCardContent>
  );
});

ConnectSlackCard.displayName = 'ConnectSlackCard';

const ConnectedDropdown = React.memo(() => {
  const { mutate: removeSlackIntegration, isPending } = useRemoveSlackIntegration();

  const dropdownItems: IDropdownItems = [
    {
      value: 'disconnect',
      label: 'Disconnect',
      icon: <LinkSlash />,
      onClick: () => {
        removeSlackIntegration();
      },
      loading: isPending,
    },
  ];

  return (
    <Dropdown items={dropdownItems} align="end" side="bottom" selectType="single">
      <div className="hover:bg-item-hover flex! cursor-pointer items-center space-x-1.5 rounded p-1.5">
        <div className="bg-success-foreground h-2.5 w-2.5 rounded-full" />
        <Text className="select-none">Connected</Text>
      </div>
    </Dropdown>
  );
});

ConnectedDropdown.displayName = 'ConnectedDropdown';

const ConnectedSlackChannels = React.memo(() => {
  const { data: slackIntegration, isLoading: isLoadingSlackIntegration } = useGetSlackIntegration();
  const {
    data: slackChannelsData,
    isLoading: isLoadingSlackChannels,
    isRefetching: isRefetchingSlackChannels,
    refetch: refetchSlackChannels,
    isFetched: isFetchedSlackChannels,
    error: slackChannelsError,
  } = useGetSlackChannels();

  const { mutate: updateSlackIntegration } = useUpdateSlackIntegration();

  const channels = slackChannelsData?.channels || [];
  const selectedChannelId = slackIntegration?.integration?.default_channel?.id;

  const items = useMemo(() => {
    return channels.map((channel) => ({
      label: channel.name,
      value: channel.id,
      selected: channel.id === selectedChannelId,
    }));
  }, [channels, selectedChannelId]);

  const numberOfSelectedChannels = useMemo(() => {
    return items.filter((item) => item.selected).length;
  }, [items]);

  const onSelect = useMemoizedFn((channelId: string) => {
    const channel = channels.find((channel) => channel.id === channelId);
    if (!channel) return;
    updateSlackIntegration({
      default_channel: channel,
    });
  });

  const showLoadingButton =
    isLoadingSlackChannels || isLoadingSlackIntegration || isRefetchingSlackChannels;

  return (
    <div className="flex items-center justify-between space-x-4 group">
      <div className="flex flex-col space-y-0.5">
        <Text>Alerts channel</Text>
        <Text variant="secondary" size={'xs'}>
          Select which Slack channel Buster should send alerts to
        </Text>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end space-x-2">
        {!slackChannelsError ? (
          <>
            {isFetchedSlackChannels && (
              <Button
                size={'tall'}
                variant="ghost"
                className="group-hover:flex hidden"
                loading={showLoadingButton}
                prefix={
                  !showLoadingButton && (
                    <span className="flex items-center justify-center text-base">
                      <Refresh />
                    </span>
                  )
                }
                onClick={() => refetchSlackChannels()}
              >
                Refresh
              </Button>
            )}

            <Dropdown
              selectType="multiple"
              items={items}
              onSelect={onSelect}
              menuHeader="Search channels"
              className="w-fit min-w-40"
            >
              <WeirdFakeSelectButtonForBlake
                label={
                  numberOfSelectedChannels > 0
                    ? `${numberOfSelectedChannels} ${pluralize('channel', numberOfSelectedChannels)} selected`
                    : 'Select a channel'
                }
              />
            </Dropdown>
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <Text variant="danger" size={'xs'}>
              Error fetching channels.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
});

ConnectedSlackChannels.displayName = 'ConnectedSlackChannels';

const SlackSharingPermissions = React.memo(() => {
  const { data: slackIntegration } = useGetSlackIntegration();
  const { mutate: updateSlackIntegration } = useUpdateSlackIntegration();

  const selectedOption: SlackSharingPermission =
    slackIntegration?.integration?.default_sharing_permissions || 'noSharing';

  const sharingOptions: IDropdownItem<SlackSharingPermission>[] = (
    createDropdownItems([
      {
        label: 'Workspace',
        value: 'shareWithWorkspace' satisfies SlackSharingPermission,
        secondaryLabel:
          'All workspace members will have access to any chat created from any channel.',
      },
      // {
      //   label: 'Channel',
      //   value: 'shareWithChannel',
      //   secondaryLabel: 'All channel members will have access to any chat created from that channel.'
      // },
      {
        label: 'None',
        value: 'noSharing' satisfies SlackSharingPermission,
        secondaryLabel: 'Only the user who sent the request will have access to their chat.',
      },
    ]) satisfies IDropdownItem<SlackSharingPermission>[]
  ).map((option) => ({
    ...option,
    selected: option.value === selectedOption,
  }));

  const selectedLabel = sharingOptions.find((option) => option.selected)?.label || 'Select option';

  const handleSelect = useMemoizedFn((value: string) => {
    updateSlackIntegration({
      default_sharing_permissions: value as SlackSharingPermission,
    });
  });

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex flex-col space-y-0.5">
        <Text>Auto-share chats with other users</Text>
        <Text variant="secondary" size={'xs'}>
          Specify how chats are auto-shared when created from Slack channels
        </Text>
      </div>
      <Dropdown
        items={sharingOptions}
        onSelect={handleSelect}
        align="end"
        side="bottom"
        selectType="single"
      >
        <WeirdFakeSelectButtonForBlake label={selectedLabel} />
      </Dropdown>
    </div>
  );
});

SlackSharingPermissions.displayName = 'SlackSharingPermissions';

const WeirdFakeSelectButtonForBlake = ({ label }: { label: string | React.ReactNode }) => {
  return (
    <div className="bg-background hover:bg-item-hover flex min-w-32 cursor-pointer items-center justify-between space-x-2 rounded border px-3 py-1.5 transition-colors">
      <Text size="sm" className="truncate">
        {label}
      </Text>
      <span className="text-icon-color flex items-center">
        <ChevronDown />
      </span>
    </div>
  );
};
