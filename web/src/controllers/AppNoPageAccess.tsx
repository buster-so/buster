import Link from 'next/link';
import React from 'react';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { Button } from '@/components/ui/buttons';
import { Title } from '@/components/ui/typography';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const AppNoPageAccess: React.FC<{
  assetId: string;
}> = React.memo(({ assetId }) => {
  return (
    <div className="flex h-[85vh] w-full flex-col items-center justify-center space-y-6">
      <BusterLogo className="h-16 w-16" />

      <div className="max-w-[440px] text-center">
        <Title as="h2" className="text-center">
          {'It looks like you don’t have access to this file...'}
        </Title>
      </div>

      <div className="flex space-x-2">
        <Link
          href={createBusterRoute({
            route: BusterRoutes.APP_HOME
          })}>
          <Button>Go home</Button>
        </Link>
      </div>
    </div>
  );
});

AppNoPageAccess.displayName = 'AppNoPageAccess';
