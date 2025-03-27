'use client';

import { createBusterRoute, BusterRoutes } from '@/routes';
import { isValidEmail, timeout } from '@/lib';
import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import Link from 'next/link';
import React, { useState } from 'react';
import { Title, Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { cn } from '@/lib/classMerge';
import { SuccessCard } from '@/components/ui/card/SuccessCard';

export const ResetEmailForm: React.FC<{
  queryEmail: string;
  resetPasswordEmailSend: (d: { email: string }) => Promise<{ error: string } | undefined>;
}> = ({ queryEmail, resetPasswordEmailSend }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(queryEmail);
  const [emailSent, setEmailSent] = useState(false);
  const { openErrorNotification } = useBusterNotifications();

  const disabled = !email || !isValidEmail(email);

  const handleResetPassword = useMemoizedFn(async () => {
    if (disabled) return;
    setLoading(true);
    const [res] = await Promise.all([resetPasswordEmailSend({ email }), timeout(450)]);
    if (res?.error) {
      openErrorNotification(res.error);
    } else {
      setEmailSent(true);
    }
    setLoading(false);
  });

  if (emailSent) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <SuccessCard
          title="Email sent"
          message="Please check your email for the reset password link"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <Title className="mb-0" as="h1">
        Reset Password
      </Title>

      <div className="flex w-[330px] flex-col gap-2">
        <Input
          placeholder="Email"
          value={email}
          onChange={(v) => {
            setEmail(v.target.value);
          }}
          onPressEnter={handleResetPassword}
        />

        <Button
          block
          loading={loading}
          variant="black"
          disabled={disabled}
          onClick={handleResetPassword}>
          Send reset password email
        </Button>
      </div>

      <Link
        className={cn(
          'text-primary flex w-full cursor-pointer justify-center text-center font-normal'
        )}
        href={createBusterRoute({
          route: BusterRoutes.AUTH_LOGIN
        })}>
        <Text variant="link" size="xs">
          Return to login
        </Text>
      </Link>
    </div>
  );
};
