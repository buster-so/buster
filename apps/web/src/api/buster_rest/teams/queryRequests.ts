import { useMutation, useQuery } from '@tanstack/react-query';
import { createTeam, getTeamsList } from './requests';

export const useCreateTeam = () => {
  return useMutation({
    mutationFn: createTeam
  });
};

export const useGetTeamsList = (params: Parameters<typeof getTeamsList>[0]) => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeamsList(params)
  });
};
