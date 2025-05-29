import type React from 'react';
import type { ReactNode } from 'react';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { ErrorBoundary } from '../error/ErrorBoundary';

interface Props {
  children: ReactNode;
}

const ErrorCardComponent: React.FC = () => {
  return (
    <StatusCard
      title="Chart rendering error"
      message="Something went wrong rendering the chart. This is likely an error on our end. Please contact Buster support."
      variant={'danger'}
    />
  );
};

export const BusterChartErrorWrapper: React.FC<Props> = ({ children }) => {
  return <ErrorBoundary errorComponent={<ErrorCardComponent />}>{children}</ErrorBoundary>;
};
