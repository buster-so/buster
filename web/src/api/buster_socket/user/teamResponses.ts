import { BusterUserTeam } from '@/api/buster_rest';

export enum TeamResponses {
  '/teams/list:listTeams' = '/teams/list:listTeams'
}

export type TeamList_listTeams = {
  route: '/teams/list:listTeams';
  callback: (d: BusterUserTeam[]) => void;
  onError?: (d: unknown) => void;
};

export type TeamResponsesTypes = TeamList_listTeams;
