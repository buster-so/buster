'use client';

import type React from 'react';
import { useMemo } from 'react';
import { Title } from '@/components/ui/typography';
import { useUserConfigContextSelector } from '@/context/Users';
import { NewChatInput } from './NewChatInput';
import { NewChatWarning } from './NewChatWarning';
import { useNewChatWarning } from './useNewChatWarning';

export const HomePageController: React.FC<Record<string, never>> = () => {
  const newChatWarningProps = useNewChatWarning();
  const { showWarning } = newChatWarningProps;

  const user = useUserConfigContextSelector((state) => state.user);
  const userName = user?.name;

  const isMorning = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    return hours < 12;
  }, []);

  const greeting = useMemo(() => {
    if (isMorning) {
      return `Good morning, ${userName}`;
    }
    return `Good afternoon, ${userName}`;
  }, [userName]);

  return (
    <div className="flex flex-col items-center justify-center p-4.5">
      {showWarning ? (
        <div className="mt-18 flex w-full max-w-[650px] flex-col space-y-6">
          <NewChatWarning {...newChatWarningProps} />
        </div>
      ) : (
        <div className="mt-[150px] flex w-full max-w-[650px] flex-col space-y-6">
          <div className="flex flex-col justify-center gap-y-1 text-center">
            <Title as="h1" className="mb-0!">
              {greeting}
            </Title>
            <Title as="h2" variant={'secondary'} className="mb-0! text-4xl!">
              How can I help you today?
            </Title>
          </div>

          <NewChatInput />
        </div>
      )}
    </div>
  );
};
