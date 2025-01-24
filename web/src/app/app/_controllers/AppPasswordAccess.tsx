'use client';

import { BusterLogo } from '@/assets/svg/BusterLogo';
import React, { useRef } from 'react';
import { Title } from '@/components/text';
import { Button, Input, InputRef, Typography } from 'antd';
import { LoginConfigProvider } from '@/app/auth/login/_components/LoginConfigProvider';
import type { BusterShareAssetType } from '@/api/buster_rest';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useMemoizedFn } from 'ahooks';

const { Text } = Typography;

export const AppPasswordAccess: React.FC<{
  threadId?: string;
  dashboardId?: string;
  type: BusterShareAssetType;
  children: React.ReactNode;
}> = React.memo(({ children, threadId, dashboardId, type }) => {
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const { password, error } = getAssetPassword(threadId || dashboardId || '');

  if (password && !error) {
    return <>{children}</>;
  }

  return (
    <AppPasswordInputComponent
      password={password}
      error={error}
      threadId={threadId}
      dashboardId={dashboardId}
    />
  );
});

AppPasswordAccess.displayName = 'AppPasswordAccess';

const AppPasswordInputComponent: React.FC<{
  password: string | undefined;
  error: string | null;
  threadId?: string;
  dashboardId?: string;
}> = ({ password, error, threadId, dashboardId }) => {
  const setAssetPassword = useBusterAssetsContextSelector((state) => state.setAssetPassword);
  const inputRef = useRef<InputRef>(null);

  const onEnterPassword = useMemoizedFn((v: string) => {
    setAssetPassword(threadId || dashboardId!, v);
  });

  const onPressEnter = useMemoizedFn((v: React.KeyboardEvent<HTMLInputElement>) => {
    onEnterPassword(v.currentTarget.value);
  });

  const onEnterButtonPress = useMemoizedFn(() => {
    const value = inputRef.current?.input?.value;
    if (!value) return;
    onEnterPassword(value || '');
  });

  return (
    <LoginConfigProvider>
      <div
        className="flex h-full min-h-[100vh] w-full justify-center"
        style={{
          marginTop: '25vh'
        }}>
        <div className="flex max-w-[340px] flex-col items-center space-y-6">
          <BusterLogo className="h-16 w-16" />

          <div className="text-center">
            <Title
              level={2}
              ellipsis={false}
              className="text-center">{`To access this page, enter the password below`}</Title>
          </div>

          <div className="flex w-full flex-col space-x-0 space-y-2">
            <div className="flex flex-col space-y-1">
              <Input
                ref={inputRef}
                defaultValue={password}
                onPressEnter={onPressEnter}
                className="w-full"
                placeholder="Enter password"
                type="password"
              />
              {error ? (
                <Text className="!mb-1" type="danger">
                  {error}
                </Text>
              ) : null}
            </div>

            <Button block type="primary" onClick={onEnterButtonPress}>
              Submit
            </Button>
          </div>
        </div>
      </div>
    </LoginConfigProvider>
  );
};
