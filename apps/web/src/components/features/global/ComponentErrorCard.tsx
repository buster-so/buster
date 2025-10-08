import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { apiErrorHandler } from '@/api/errors';

const ErrorCard = lazy(() =>
  import('./GlobalErrorCard').then((module) => ({
    default: module.ErrorCard,
  }))
);

export const ComponentErrorCard = ({
  children,
  header,
  message,
}: {
  children: React.ReactNode;
  header?: string;
  message?: string;
}) => {
  return (
    <ErrorBoundary
      fallbackRender={(e) => {
        const errorMessage: string | undefined = apiErrorHandler(e).message || undefined;
        return (
          <Suspense fallback={<div />}>
            <ErrorCard header={header} message={errorMessage || message} />
          </Suspense>
        );
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
