import React, { useMemo } from 'react';
import GithubIcon from '@/components/ui/icons/customIcons/Github';
import { SettingCardContent, SettingsCards } from '../settings';

export const GithubIntegrations = React.memo(() => {
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
            Enable Github integration
          </SettingCardContent>,
        ],
      },
    ];
  }, []);

  return <SettingsCards title="Github" description="Connect Buster with Github" cards={cards} />;
});

GithubIntegrations.displayName = 'GithubIntegrations';
