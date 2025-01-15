import { mainApi } from '../instances';
import { DatasetGroup } from './responseInterfaces';

export const listDatasetGroups = async () => {
  return mainApi.get<DatasetGroup[]>(`/dataset_groups`).then((res) => res.data);
};

export const createDatasetGroup = async (data: { name: string }) => {
  return mainApi.post(`/dataset_groups`, data).then((res) => res.data);
};

export const updateDatasetGroup = async (data: { id: string; name: string }[]) => {
  return mainApi.put(`/dataset_groups`, data).then((res) => res.data);
};

export const deleteDatasetGroup = async (id: string) => {
  return mainApi.delete(`/dataset_groups/${id}`).then((res) => res.data);
};

export const getDatasetGroup = async (id: string) => {
  return mainApi.get(`/dataset_groups/${id}`).then((res) => res.data);
};
