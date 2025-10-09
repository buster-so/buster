import { useNavigate } from '@tanstack/react-router';
import type React from 'react';
import { useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/buttons';
import { Paragraph, Title } from '@/components/ui/typography';
import { useIsVersionChanged } from '@/context/AppVersion/useAppVersion';
import { useMount } from '@/hooks/useMount';
import { cn } from '@/lib/utils';
import { Route as HomeRoute } from '@/routes/app/_app/home';

export const LazyErrorBoundary: React.FC<React.PropsWithChildren> = ({ children }) => {
  const isChanged = useIsVersionChanged();
  const navigate = useNavigate();
  return (
    <ErrorBoundary
      fallbackRender={() => {
        if (isChanged) {
          window.location.reload();
          return null;
          // return (
          //   <ComponentErrorCard
          //     highlightType="info"
          //     message="The app has been updated. Please reload the page."
          //     title="New version available"
          //     buttonText="Reload"
          //     onButtonClick={() => {
          //       navigate({ reloadDocument: true });
          //     }}
          //   />
          // );
        }

        return (
          <ComponentErrorCard
            onButtonClick={() => {
              navigate({ to: HomeRoute.to, reloadDocument: true });
            }}
          />
        );
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

const ComponentErrorCard: React.FC<{
  title?: string;
  message?: string;
  containerClassName?: string;
  cardClassName?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  highlightType?: 'danger' | 'info' | 'none';
}> = ({
  containerClassName,
  cardClassName,
  highlightType = 'danger',
  onButtonClick,
  buttonText = 'Take me home',
  title = 'We hit an unexpected error',
  message = "Our team has been notified via Slack. We'll take a look at the issue ASAP and get back to you.",
}) => {
  const style: React.CSSProperties = useMemo(() => {
    let vars: React.CSSProperties = {};

    if (highlightType === 'danger') {
      vars = {
        '--color-highlight-background': 'var(--color-red-100)',
        '--color-highlight-border': 'red',
      } as React.CSSProperties;
    }

    if (highlightType === 'info') {
      vars = {
        '--color-highlight-background': 'var(--color-purple-50)',
        '--color-highlight-border': 'blue',
      } as React.CSSProperties;
    }

    return {
      ...vars,
      '--color-highlight-to-background': 'transparent',
      '--color-highlight-to-border': 'transparent',
      '--duration': '600ms',
    } as React.CSSProperties;
  }, [highlightType]);

  return (
    <div
      className={cn(
        'animate-highlight-fade',
        'flex h-full w-full flex-col items-center justify-center p-5 bg-background text-center gap-4',
        containerClassName
      )}
      style={style}
      role="alert"
    >
      <div
        className={cn(
          'bg-background flex flex-col gap-4 p-5 rounded duration-300 shadow hover:shadow-lg transition-all border',
          highlightType === 'danger' && 'shadow-red-100 ',
          cardClassName
        )}
      >
        <Title as={'h4'}>{title}</Title>
        <Paragraph>{message}</Paragraph>
        <Button variant="black" block size="tall" onClick={onButtonClick}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
};
