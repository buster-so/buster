import { useShape as useElectricShape } from '@electric-sql/react';
import { ELECTRIC_BASE_URL } from './config';

export const useShape = (params: Omit<Parameters<typeof useElectricShape>[0], 'url'>) => {
  return useElectricShape({
    ...params,
    url: ELECTRIC_BASE_URL
  });
};
