import { StatusCard } from '@/components/ui/card/StatusCard';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '../error/ErrorBoundary';
import type React from 'react';

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
