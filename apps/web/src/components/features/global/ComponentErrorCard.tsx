import { ErrorBoundary } from 'react-error-boundary';
import { apiErrorHandler } from '@/api/errors';
import { ErrorCard } from './GlobalErrorCard';

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
        return <ErrorCard header={header} message={errorMessage || message} />;
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
