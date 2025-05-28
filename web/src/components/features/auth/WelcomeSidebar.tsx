import type React from 'react';
import { Text } from '@/components/ui/typography';
import Link from 'next/link';
import { BusterLogoWithText } from '@/assets/svg/BusterLogoWithText';
import { BUSTER_HOME_PAGE } from '@/routes/externalRoutes';

export const WelcomeToBuster: React.FC<{
  hasUser: boolean;
}> = () => {
  return (
    <div className="flex h-full w-full flex-col justify-between p-10">
      <div>
        <div className="w-[130px]">
          <Link href={BUSTER_HOME_PAGE}>
            <BusterLogoWithText />
          </Link>
        </div>
        <div className="mt-24">
          <h1
            className="mb-3"
            style={{
              fontSize: 48
            }}>
            Welcome to Buster.
          </h1>
          <div className="text-lg">Stand up a PoC in 30 minutes.</div>
        </div>
      </div>
      <div>
        <div className="flex space-x-8">
          <a href="#">
            <Text>Terms of Service</Text>
          </a>
          <a href="#">
            <Text>Privacy Policy</Text>
          </a>
        </div>
      </div>
    </div>
  );
};
