'use client';

import { Title } from '@/components';
import React, { useState } from 'react';
import { Button, Input } from 'antd';
import { PolicyCheck } from '../login/_components/PolicyCheck';
import { useMemoizedFn } from 'ahooks';
import { BusterAppRoutes } from '@/routes/busterRoutes/busterAppRoutes';
import type { User } from '@supabase/supabase-js';
import type { BusterUserResponse } from '@/api/buster_rest';
import { useRouter } from 'next/navigation';
import { createBusterRoute } from '@/routes';
import { Result } from 'antd';
import { useBusterNotifications } from '@/context/BusterNotifications';

export const ResetPasswordForm: React.FC<{
  supabaseUser: User;
  busterUser: BusterUserResponse;
  resetPassword: (d: { password: string }) => Promise<{ error: string } | undefined>;
}> = ({ supabaseUser, busterUser, resetPassword }) => {
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();
  const email = busterUser?.user?.email || supabaseUser?.email;
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [goodPassword, setGoodPassword] = useState(false);
  const { openErrorNotification, openSuccessMessage } = useBusterNotifications();
  const [countdown, setCountdown] = useState(5);

  const disabled = !goodPassword || loading || !password || !password2 || password !== password2;

  const startCountdown = useMemoizedFn(() => {
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 0) {
          clearInterval(interval);
          router.replace(createBusterRoute({ route: BusterAppRoutes.APP_ROOT }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  });

  const handleResetPassword = useMemoizedFn(async () => {
    setLoading(true);
    setResetSuccess(false);
    try {
      const res = await resetPassword({ password });
      setLoading(false);
      if (res?.error) {
        throw res;
      } else {
        setResetSuccess(true);
        openSuccessMessage('Password reset successfully');
        startCountdown();
      }
    } catch (error) {
      openErrorNotification(error);
    }
  });

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      {!resetSuccess && (
        <>
          <Title className="mb-0" level={1}>
            Reset Password
          </Title>
          <div className="flex w-[330px] flex-col gap-2">
            <Input placeholder="Email" disabled value={email} autoComplete="email" />

            <Input
              placeholder="Password"
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={(v) => {
                setPassword(v.target.value);
              }}
              autoComplete="new-password"
            />

            <Input
              value={password2}
              onChange={(v) => {
                setPassword2(v.target.value);
              }}
              disabled={!!loading}
              id="password2"
              type="password"
              name="password2"
              placeholder="Confirm password"
              onPressEnter={() => {
                if (disabled) {
                  return;
                }
                handleResetPassword();
              }}
              autoComplete="new-password"
            />

            <PolicyCheck
              placement="top"
              password={password}
              show={!!password}
              onCheckChange={(v) => {
                setGoodPassword(v);
              }}>
              <Button
                block
                type="primary"
                disabled={disabled}
                loading={loading}
                onClick={handleResetPassword}>
                Reset Password
              </Button>
            </PolicyCheck>
          </div>
        </>
      )}

      {resetSuccess && (
        <div className="flex w-[330px] flex-col gap-2">
          <Result
            status="success"
            title="Password reset successfully"
            subTitle={`Navigating to app in ${countdown} seconds`}
          />
        </div>
      )}

      {/* <Link
        className={cx(
          'flex w-full cursor-pointer justify-center text-center font-normal',
          styles.link
        )}
        href={createBusterRoute({
          route: BusterRoutes.AUTH_LOGIN
        })}>
        <Text type="primary" size="xxs">
          Return to login
        </Text>
      </Link> */}
    </div>
  );
};
