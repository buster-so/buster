import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/buttons';
import { SuccessCard } from '@/components/ui/card/SuccessCard';
import { Input } from '@/components/ui/inputs';
import { Text, Title } from '@/components/ui/typography';
import { resetPasswordEmailSend } from '@/integrations/supabase/resetPassword';
import { cn } from '@/lib/classMerge';
import { isValidEmail } from '@/lib/email';

export const ResetEmailForm: React.FC<{
  queryEmail: string;
}> = ({ queryEmail }) => {
  const [email, setEmail] = useState(queryEmail);
  const [emailSent, setEmailSent] = useState(false);
  const { mutateAsync: resetPasswordEmailSendMutation, isPending: loading } = useMutation({
    mutationFn: resetPasswordEmailSend,
  });

  const disabled = !email || !isValidEmail(email);

  const handleResetPassword = async () => {
    if (disabled) return;
    const [res] = await Promise.all([resetPasswordEmailSendMutation({ data: { email } })]);

    setEmailSent(true);
  };

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
          onClick={handleResetPassword}
        >
          Send reset password email
        </Button>
      </div>

      <Link
        className={cn(
          'text-primary flex w-full cursor-pointer justify-center text-center font-normal'
        )}
        to={'/auth/login'}
      >
        <Text variant="link" size="xs">
          Return to login
        </Text>
      </Link>
    </div>
  );
};
