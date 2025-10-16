import type { GetGitHubIntegrationResponse } from '@buster/server-shared/github';
import React, { useMemo } from 'react';
import {
  useDeleteGitHubIntegration,
  useGetGitHubIntegration,
  useInitiateGitHubAppInstall,
} from '@/api/buster_rest/github';
import { Button } from '@/components/ui/buttons';
import { createDropdownItems, Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import { ChevronDown } from '@/components/ui/icons';
import GithubIcon from '@/components/ui/icons/customIcons/Github';
import LinkSlash from '@/components/ui/icons/NucleoIconOutlined/link-slash';
import { Text } from '@/components/ui/typography';
import { SettingCardContent, SettingsCards } from '../settings';

// const githubIntegration: GetGitHubIntegrationResponse = {
//   connected: true,
//   status: 'active',
//   integration: {
//     id: '123',
//     github_org_name: 'Test Org',
//     github_org_id: '123',
//     installation_id: '123',
//     installed_at: '2021-01-01',
//     last_used_at: '2021-01-01',
//   },
// };

export const GithubIntegrations = React.memo(() => {
  const { data: githubIntegration } = useGetGitHubIntegration();

  const isConnected = githubIntegration?.connected ?? false;

  const cards = useMemo(() => {
    return [
      {
        sections: [
          <SettingCardContent
            key="github-integration"
            title="Github account"
            description="Link your GitHub account to Buster"
            icon={
              <span className="text-lg">
                <GithubIcon />
              </span>
            }
          >
            {!isConnected || !githubIntegration ? (
              <ConnectGithubButton />
            ) : (
              <ConnectedDropdown githubIntegration={githubIntegration} />
            )}
          </SettingCardContent>,
        ],
      },
    ];
  }, [isConnected, githubIntegration]);

  return <SettingsCards title="Github" description="Connect Buster with Github" cards={cards} />;
});

GithubIntegrations.displayName = 'GithubIntegrations';

const ConnectedDropdown = ({
  githubIntegration,
}: {
  githubIntegration: GetGitHubIntegrationResponse;
}) => {
  const { mutate: deleteGitHubIntegration, isPending } = useDeleteGitHubIntegration();
  const accountName = githubIntegration.integration?.github_org_name;
  const dropdownItems: IDropdownItems = createDropdownItems([
    {
      label: 'Disconnect',
      value: 'disconnect',
      loading: isPending,
      onClick: () => {
        deleteGitHubIntegration();
      },
      icon: <LinkSlash />,
    },
  ]);

  return (
    <Dropdown items={dropdownItems} align="end" side="bottom" selectType="single">
      <div className="hover:bg-item-hover flex! cursor-pointer items-center space-x-1.5 rounded p-1.5">
        <div className="bg-success-foreground h-2.5 w-2.5 rounded-full" />
        <Text className="select-none">{accountName || 'Connected'}</Text>
        <ChevronDown />
      </div>
    </Dropdown>
  );
};

const ConnectGithubButton = () => {
  const { mutate: initiateGitHubAppInstall, isPending } = useInitiateGitHubAppInstall();

  return (
    <Button
      prefix={<GithubIcon />}
      loading={isPending}
      size="tall"
      onClick={() => initiateGitHubAppInstall()}
      disabled={isPending}
    >
      Connect Github
    </Button>
  );
};
