'use client';

import React, { useMemo } from 'react';
import { SettingsCards } from '../settings/SettingsCard';
import Bucket from '@/components/ui/icons/NucleoIconOutlined/bucket';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/buttons';
import { useGetS3Integration, useDeleteS3Integration } from '@/api/buster_rest/s3-integrations';
import { Dropdown, type DropdownItems } from '@/components/ui/dropdown';
import { LinkSlash } from '@/components/ui/icons';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { useRouter } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const StorageIntegrations = React.memo(() => {
  const {
    data: s3Integration,
    isFetched: isFetchedS3Integration,
    error: s3IntegrationError
  } = useGetS3Integration();

  const isConnected = s3Integration !== null;

  const cards = useMemo(() => {
    const sections = [
      <ConnectStorageCard key="connect-storage-card" />,
      isConnected && <StorageConfiguration key="storage-configuration" />
    ].filter(Boolean);
    return [{ sections }];
  }, [isConnected]);

  if (s3IntegrationError) {
    return <StatusCard message="Error fetching storage integration." variant={'danger'} />;
  }

  if (!isFetchedS3Integration) {
    return <div className="bg-gray-light/50 h-24 w-full animate-pulse rounded"></div>;
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
  const router = useRouter();

  const isConnected = s3Integration !== null;

  const handleConnect = () => {
    router.push(
      createBusterRoute({
        route: BusterRoutes.SETTINGS_STORAGE_ADD
      })
    );
  };

  return (
    <div className="flex items-center justify-between gap-x-2">
      <div className="flex space-x-2">
        <div className="bg-item-select flex items-center justify-center rounded p-2">
          <Bucket strokewidth={1.5} />
        </div>
        <div className="flex flex-col space-y-0.5">
          <Text>Storage account</Text>
          <Text variant="secondary" size={'xs'}>
            Link your storage bucket to use file storage with Buster
          </Text>
        </div>
      </div>

      {isConnected ? (
        <ConnectedDropdown />
      ) : (
        <Button prefix={<Bucket strokewidth={1.5} />} onClick={handleConnect} size={'tall'}>
          Connect Storage
        </Button>
      )}
    </div>
  );
});

ConnectStorageCard.displayName = 'ConnectStorageCard';

const ConnectedDropdown = React.memo(() => {
  const { data: s3Integration } = useGetS3Integration();
  const { mutate: deleteS3Integration, isPending } = useDeleteS3Integration();

  const dropdownItems: DropdownItems = [
    {
      value: 'disconnect',
      label: 'Disconnect',
      icon: <LinkSlash />,
      onClick: () => {
        if (s3Integration?.id) {
          deleteS3Integration(s3Integration.id);
        }
      },
      loading: isPending
    }
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
    gcs: 'Google Cloud Storage'
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
