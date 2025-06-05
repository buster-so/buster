'use client';

import { useSearchParams } from 'next/navigation';
import { ResetEmailForm } from '@/components/features/auth/ResetEmailForm';
import { resetPasswordEmailSend } from '@/lib/supabase/resetPassword';

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get('email') || '';

  return <ResetEmailForm queryEmail={queryEmail} resetPasswordEmailSend={resetPasswordEmailSend} />;
}
