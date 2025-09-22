import type { QueryClient } from '@tanstack/react-query';
import type React from 'react';

export const QueryPersister = ({
  children,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) => {
  return children;
};
