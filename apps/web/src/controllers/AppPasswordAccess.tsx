'use client';

import React, { useRef } from 'react';
import type { ShareAssetType } from '@buster/server-shared/share';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import { Title } from '@/components/ui/typography';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useMemoizedFn } from '@/hooks';

export const AppPasswordAccess: React.FC<{
  assetId: string;
  type: ShareAssetType;
  children: React.ReactNode;
}> = ({ children, assetId, type }) => {
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const { password, error } = getAssetPassword(assetId);

  if (password && !error) {
    return <>{children}</>;
  }

  return (
    <AppPasswordInputComponent password={password} error={error} assetId={assetId} type={type} />
  );
};

AppPasswordAccess.displayName = 'AppPasswordAccess';

const AppPasswordInputComponent: React.FC<{
  password: string | undefined;
  error: string | null;
  assetId: string;
  type: ShareAssetType;
}> = ({ password, error, assetId, type }) => {
  const onSetAssetPassword = useBusterAssetsContextSelector((state) => state.onSetAssetPassword);
  const inputRef = useRef<HTMLInputElement>(null);

  const onEnterPassword = useMemoizedFn((v: string) => {
    onSetAssetPassword(assetId, v, type);
  });

  const onPressEnter = useMemoizedFn((v: React.KeyboardEvent<HTMLInputElement>) => {
    onEnterPassword(v.currentTarget.value);
  });

  const onEnterButtonPress = useMemoizedFn(() => {
    const value = inputRef.current?.value;
    if (!value) return;
    onEnterPassword(value || '');
  });

  return (
    <div
      className="flex h-full min-h-[100vh] w-full justify-center"
      style={{
        paddingTop: '25vh'
      }}>
      <div className="flex max-w-[440px] flex-col items-center space-y-6">
        <BusterLogo className="h-16 w-16" />

        <div className="text-center">
          <Title as="h2" className="text-center">
            {'To access this page, enter the password below'}
          </Title>
        </div>

        <div className="flex w-full flex-col space-y-2 space-x-0">
          <div className="flex flex-col space-y-1">
            <Input
              ref={inputRef}
              defaultValue={password}
              onPressEnter={onPressEnter}
              className="w-full"
              placeholder="Enter password"
              type="password"
              autoFocus
            />
            {/* {error ? (
              <Text className="mb-1!" variant="danger">
                {error}
              </Text>
            ) : null} */}
          </div>

          <Button block variant="black" onClick={onEnterButtonPress}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};
