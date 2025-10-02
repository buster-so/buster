import type { AssetType } from '@buster/server-shared/assets';
import type { ResponseMessageFileType } from '@buster/server-shared/chats';
import { Link, type LinkProps, useLocation } from '@tanstack/react-router';
import type React from 'react';
import { useMemo } from 'react';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { Button } from '@/components/ui/buttons';
import { Title } from '@/components/ui/typography';
import { useIsAnonymousSupabaseUser } from '@/context/Supabase';

const translationRecord: Record<AssetType | ResponseMessageFileType, string> = {
  metric_file: 'metric',
  chat: 'chat',
  report_file: 'report',
  dashboard_file: 'dashboard',
  collection: 'collection',
  reasoning: 'reasoning',
};

export const AppNoPageAccess: React.FC<{
  assetId: string;
  type: AssetType | ResponseMessageFileType;
}> = ({ type }) => {
  const isAnonymousUser = useIsAnonymousSupabaseUser();
  const location = useLocation();

  const { buttonText, link } = useMemo(() => {
    const isEmbedPage = window?.location.pathname.startsWith('/embed');

    const shouldShowLogin = isAnonymousUser || isEmbedPage;

    if (shouldShowLogin) {
      const currentUrl = typeof window !== 'undefined' ? `${location.href}` : '';
      return {
        buttonText: 'Login to view asset',
        link: {
          to: '/auth/login',
          search: {
            next: currentUrl,
          },
        } as const satisfies LinkProps,
      };
    }

    return {
      buttonText: 'Go home',
      link: {
        to: '/app/home',
      } as const satisfies LinkProps,
    };
  }, [isAnonymousUser]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-6 bg-background">
      <BusterLogo className="h-16 w-16" />

      <div className="max-w-[550px] text-center">
        <Title as="h2" className="text-center">
          {`It looks like you don't have access to this ${translationRecord[type] || 'file'}...`}
        </Title>
      </div>

      <div className="flex space-x-2">
        <Link {...link}>
          <Button>{buttonText}</Button>
        </Link>
      </div>
    </div>
  );
};
