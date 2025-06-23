import { useMutation } from '@tanstack/react-query';
import { runSQL } from './requests';

export const useRunSQL = () => {
  return useMutation({
    mutationFn: runSQL //TODO move the
  });
};
