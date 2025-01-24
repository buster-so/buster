import React, { useEffect, useMemo, useState } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { BusterPermissionListTeam } from '@/api/buster_rest/permissions';
import { useMemoizedFn } from 'ahooks';
import { PermissionListTeamRequest } from '@/api/buster_socket/permissions';
import { useBusterNotifications } from '../BusterNotifications';
import { usePermissionsContextSelector } from './PermissionsConfigProvider';

export const usePermissionsTeams = () => {
  const busterSocket = useBusterWebSocket();
  const { openConfirmModal } = useBusterNotifications();
  const [openCreateTeamModal, setOpenCreateTeamModal] = useState(false);
  const [teamsList, setTeamsList] = useState<Record<string, BusterPermissionListTeam[]>>({});
  const [loadedTeamsList, setLoadedTeamsList] = useState(false);

  const _onInitTeamsList = useMemoizedFn(
    (
      teams: BusterPermissionListTeam[],
      filters: Omit<PermissionListTeamRequest['payload'], 'page' | 'page_size'>
    ) => {
      setTeamsList((prev) => ({ ...prev, [JSON.stringify(filters)]: teams }));
      setLoadedTeamsList(true);
      return teams;
    }
  );

  const initTeamList = useMemoizedFn(
    async (filters: Omit<PermissionListTeamRequest['payload'], 'page' | 'page_size'> = {}) => {
      const res = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/permissions/teams/list',
          payload: {
            page: 0,
            page_size: 1000,
            ...filters
          }
        },
        responseEvent: {
          route: '/permissions/teams/list:listTeamPermissions',
          callback: (v) => {
            _onInitTeamsList(v, filters);
          }
        }
      });

      return res as BusterPermissionListTeam[];
    }
  );

  const deleteTeam = useMemoizedFn(
    async (teamIdsToDelete: string[], ignoreConfirmation = false) => {
      const method = async () => {
        setTeamsList((prev) => {
          const newTeamsList = { ...prev };
          Object.keys(newTeamsList).forEach((filterKey) => {
            const teamIds = newTeamsList[filterKey];
            const filteredTeamIds = teamIds?.filter((team) => !teamIdsToDelete.includes(team?.id));
            newTeamsList[filterKey] = filteredTeamIds;
            if (filteredTeamIds.length === 0) {
              delete newTeamsList[filterKey];
            }
          });
          return newTeamsList;
        });

        await busterSocket.emitAndOnce({
          emitEvent: {
            route: '/permissions/teams/delete',
            payload: {
              ids: teamIdsToDelete
            }
          },
          responseEvent: {
            route: '/permissions/teams/delete:deleteTeamPermission',
            callback: () => {}
          }
        });
      };

      if (ignoreConfirmation) {
        return method();
      }

      return await openConfirmModal({
        title: 'Delete Team',
        content: 'Are you sure you want to delete this team?',
        onOk: method
      }).catch((e) => {});
    }
  );

  return {
    deleteTeam,
    initTeamList,
    teamsList,
    loadedTeamsList,
    openCreateTeamModal,
    setOpenCreateTeamModal
  };
};

export const usePermissionTeamsListIndividual = (
  filters: Omit<PermissionListTeamRequest['payload'], 'page' | 'page_size'> = {}
) => {
  const teamsList = usePermissionsContextSelector((x) => x.teamsList);
  const initTeamList = usePermissionsContextSelector((x) => x.initTeamList);
  const key = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    initTeamList(filters);
  }, [initTeamList, key]);

  return teamsList[key] || [];
};
