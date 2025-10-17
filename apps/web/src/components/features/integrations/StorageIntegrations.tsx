import { Link } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { useDeleteS3Integration, useGetS3Integration } from '@/api/buster_rest/s3-integrations';
import { Button } from '@/components/ui/buttons';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import Bucket from '@/components/ui/icons/NucleoIconOutlined/bucket';
import LinkSlash from '@/components/ui/icons/NucleoIconOutlined/link-slash';
import { Text } from '@/components/ui/typography';
import { SettingCardContent, SettingsCards } from '../settings/SettingsCard';
import { IntegrationSkeleton } from './IntegrationSkeleton';

export const StorageIntegrations = React.memo(() => {
  const {
    data: s3Integration,
    isFetched: isFetchedS3Integration,
    error: s3IntegrationError,
  } = useGetS3Integration();

  const isConnected = s3Integration !== null;

  const cards = useMemo(() => {
    const sections = [
      <ConnectStorageCard key="connect-storage-card" />,
      isConnected && <StorageConfiguration key="storage-configuration" />,
    ].filter(Boolean);
    return [{ sections }];
  }, [isConnected]);

  if (s3IntegrationError) {
    return <StatusCard message="Error fetching storage integration." variant={'danger'} />;
  }

  if (!isFetchedS3Integration) {
    return <IntegrationSkeleton />;
  }

  return (
    <SettingsCards
      title="Object Storage"
      description="Connect an S3 compatible storage bucket to Buster"
      cards={cards}
    />
  );
});

StorageIntegrations.displayName = 'StorageIntegrations';

const ConnectStorageCard = React.memo(() => {
  const { data: s3Integration } = useGetS3Integration();

  const isConnected = s3Integration !== null;

  return (
    <SettingCardContent
      title="Storage account"
      description="Link your storage bucket to use file storage with Buster"
      icon={<Bucket strokewidth={1.5} />}
    >
      {isConnected ? (
        <ConnectedDropdown />
      ) : (
        <Link to={'/app/settings/storage/add'}>
          <Button prefix={<Bucket strokewidth={1.5} />} size={'tall'}>
            Connect Storage
          </Button>
        </Link>
      )}
    </SettingCardContent>
  );
});

ConnectStorageCard.displayName = 'ConnectStorageCard';

const ConnectedDropdown = React.memo(() => {
  const { data: s3Integration } = useGetS3Integration();
  const { mutate: deleteS3Integration, isPending } = useDeleteS3Integration();

  const dropdownItems: IDropdownItems = [
    {
      value: 'disconnect',
      label: 'Disconnect',
      icon: <LinkSlash />,
      onClick: () => {
        if (s3Integration?.id) {
          deleteS3Integration(s3Integration.id);
        }
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

const StorageConfiguration = React.memo(() => {
  const { data: s3Integration } = useGetS3Integration();

  if (!s3Integration) return null;

  const providerLabels = {
    s3: 'AWS S3',
    r2: 'Cloudflare R2',
    gcs: 'Google Cloud Storage',
  };

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex flex-col space-y-0.5">
        <Text>Storage provider</Text>
        <Text variant="secondary" size={'xs'}>
          Currently connected to {providerLabels[s3Integration.provider]}
        </Text>
      </div>
      <div className="flex items-center space-x-2">
        <Text size="sm" className="text-icon-color">
          {s3Integration.bucketName || providerLabels[s3Integration.provider]}
        </Text>
      </div>
    </div>
  );
});

StorageConfiguration.displayName = 'StorageConfiguration';
