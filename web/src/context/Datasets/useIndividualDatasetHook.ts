import { useGetDatasetData, useGetDatasetMetadata } from '@/api/buster-rest/datasets';

export const useIndividualDataset = ({ datasetId }: { datasetId: string }) => {
  const dataset = useGetDatasetMetadata(datasetId);
  const datasetData = useGetDatasetData(datasetId);
  return { dataset, datasetData };
};
