import type { User } from '@supabase/supabase-js';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import type React from 'react';
import { useCallback, useState } from 'react';
import { useGetMyUserInfo } from '@/api/buster_rest/users';
import { Button } from '@/components/ui/buttons';
import { SuccessCard } from '@/components/ui/card/SuccessCard';
import { Input } from '@/components/ui/inputs';
import { Text, Title } from '@/components/ui/typography';
import { openErrorNotification } from '@/context/BusterNotifications';
import { resetPassword } from '@/integrations/supabase/resetPassword';
import { PolicyCheck } from './PolicyCheck';

export const ResetPasswordForm: React.FC<{
  supabaseUser: Pick<User, 'email'>;
}> = ({ supabaseUser }) => {
  const { data: busterUser } = useGetMyUserInfo();
  const navigate = useNavigate();
  const [resetSuccess, setResetSuccess] = useState(false);
  const email = busterUser?.user?.email || supabaseUser?.email;
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [goodPassword, setGoodPassword] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [errorMessage, setErrorMessage] = useState('');

  const { mutateAsync: resetPasswordMutation, isPending: loading } = useMutation({
    mutationFn: resetPassword,
  });

  const disabled = !goodPassword || loading || !password || !password2 || password !== password2;

  const startCountdown = useCallback(() => {
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 0) {
          clearInterval(interval);
          navigate({ to: '/app/home', replace: true, reloadDocument: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResetPassword = useCallback(async () => {
    if (loading) {
      return;
    }

    if (!password || !password2 || password !== password2 || !goodPassword) {
      openErrorNotification('Password and confirm password do not match');
      return;
    }

    setResetSuccess(false);
    setErrorMessage('');

    try {
      await resetPasswordMutation({ data: { password } });
      setResetSuccess(true);
      startCountdown();
    } catch (error) {
      openErrorNotification(error as string);
      setErrorMessage(error as string);
    }
  }, [
    resetPassword,
    password,
    password2,
    goodPassword,
    loading,
    setResetSuccess,
    startCountdown,
    resetPasswordMutation,
    openErrorNotification,
  ]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      {!resetSuccess && (
        <>
          <Title className="mb-0" as="h1">
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

            {errorMessage && (
              <Text size="xs" variant="danger">
                {errorMessage}
              </Text>
            )}

            <PolicyCheck
              password={password}
              password2={password2}
              email={email || ''}
              onChangePolicyCheck={(v) => {
                setGoodPassword(v);
              }}
            />

            <Button
              block
              variant="black"
              disabled={disabled}
              loading={loading}
              onClick={handleResetPassword}
            >
              Reset Password
            </Button>
          </div>
        </>
      )}

      {resetSuccess && (
        <div className="flex w-[330px] flex-col gap-2">
          <SuccessCard
            title="Password reset successfully"
            message={`Navigating to app in ${countdown} seconds`}
            extra={
              <Link to="/app/home" reloadDocument replace>
                <Button block variant="black">
                  Go to app now
                </Button>
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
};
