import React, { useMemo } from 'react';
import { useGetGitHubIntegration, useInitiateGitHubAppInstall } from '@/api/buster_rest/github';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import GithubIcon from '@/components/ui/icons/customIcons/Github';
import { Text } from '@/components/ui/typography';
import { SettingCardContent, SettingsCards } from '../settings';

export const GithubIntegrations = React.memo(() => {
  const { data: githubIntegration } = useGetGitHubIntegration();

  const isConnected = githubIntegration?.connected ?? false;

  const cards = useMemo(() => {
    return [
      {
        sections: [
          <SettingCardContent
            key="github-integration"
            title="Github integration"
            description="Connect Buster with Github"
            icon={
              <span className="text-lg">
                <GithubIcon />
              </span>
            }
          >
            {!isConnected ? <ConnectGithubButton /> : <ConnectedDropdown />}
          </SettingCardContent>,
        ],
      },
    ];
  }, [isConnected]);

  return <SettingsCards title="Github" description="Connect Buster with Github" cards={cards} />;
});

GithubIntegrations.displayName = 'GithubIntegrations';

const ConnectedDropdown = () => {
  const dropdownItems: IDropdownItems = [];

  return (
    <Dropdown items={dropdownItems} align="end" side="bottom" selectType="single">
      <div className="hover:bg-item-hover flex! cursor-pointer items-center space-x-1.5 rounded p-1.5">
        <div className="bg-success-foreground h-2.5 w-2.5 rounded-full" />
        <Text className="select-none">Connected</Text>
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
