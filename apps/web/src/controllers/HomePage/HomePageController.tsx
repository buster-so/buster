import { ClientOnly } from '@tanstack/react-router';
import type React from 'react';
import { lazy, Suspense, useMemo } from 'react';
import { useGetUserBasicInfo } from '@/api/buster_rest/users/useGetUserInfo';
import { LazyErrorBoundary } from '@/components/features/global/LazyErrorBoundary';
import { BusterChatInput } from '@/components/features/input/BusterChatInput';
import { Title } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import { useNewChatWarning } from './useNewChatWarning';

const LazyNewChatWarning = lazy(() =>
  import('./NewChatWarning').then((mod) => ({ default: mod.NewChatWarning }))
);

enum TimeOfDay {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night',
}

export const HomePageController: React.FC<{
  initialValue?: string;
  autoSubmit?: boolean;
}> = ({ initialValue, autoSubmit }) => {
  const newChatWarningProps = useNewChatWarning();
  const greeting = useGreeting();
  const { showWarning } = newChatWarningProps;

  return (
    <div className={cn('flex flex-col items-center px-5 py-5 h-full')}>
      {showWarning ? (
        <div className="mt-18 flex w-full max-w-[650px] flex-col space-y-6">
          <LazyErrorBoundary>
            <Suspense fallback={null}>
              <LazyNewChatWarning {...newChatWarningProps} />
            </Suspense>
          </LazyErrorBoundary>
        </div>
      ) : (
        <ClientOnly>
          <div className="mt-[150px] flex w-full max-w-[650px] flex-col space-y-6">
            <div className="flex flex-col justify-center gap-y-1 text-center">
              <Title as="h1" className="mb-0!">
                {greeting}
              </Title>
              <Title as="h2" variant={'secondary'} className="mb-0! text-4xl!">
                How can I help you today?
              </Title>
            </div>

            <BusterChatInput initialValue={initialValue} autoSubmit={autoSubmit} />
          </div>
        </ClientOnly>
      )}
    </div>
  );
};

const useGreeting = () => {
  const user = useGetUserBasicInfo();
  const userName = user?.name;

  const timeOfDay = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 4 && hours < 12) {
      return TimeOfDay.MORNING;
    } else if (hours >= 12 && hours <= 19) {
      return TimeOfDay.AFTERNOON;
    } else if (hours >= 19 && hours <= 22) {
      return TimeOfDay.EVENING;
    } else {
      return TimeOfDay.NIGHT;
    }
  }, []);

  const greeting = useMemo(() => {
    switch (timeOfDay) {
      case TimeOfDay.MORNING:
        return `Good morning, ${userName}`;
      case TimeOfDay.AFTERNOON:
        return `Good afternoon, ${userName}`;
      case TimeOfDay.EVENING:
        return `Good evening, ${userName}`;
      case TimeOfDay.NIGHT:
        return `Good night, ${userName}`;
      default:
        return `Hello, ${userName}`;
    }
  }, [timeOfDay, userName]);

  return greeting;
};
