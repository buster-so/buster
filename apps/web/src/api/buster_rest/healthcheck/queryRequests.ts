import { useQuery } from '@tanstack/react-query';
import { getHealthcheck } from './requests';

export const useHealthcheck = () => {
  return useQuery({
    queryKey: ['healthcheck'] as const,
    queryFn: getHealthcheck,
    refetchInterval: 1000 * 30, // 30 seconds
  });
};
