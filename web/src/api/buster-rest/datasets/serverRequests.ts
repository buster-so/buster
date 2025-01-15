'use server';

import { serverFetch } from '../../createServerInstance';
import { BusterDataset } from './responseInterfaces';
import * as config from './config';

export const getDatasetMetadata_server = async (datasetId: string) => {
  return await serverFetch<BusterDataset>(config.GET_DATASET_URL(datasetId));
};
