import { QueryClient, useQuery } from '@tanstack/react-query';
import { getAssetCheck, getAssetCheck_server } from './requests';
import { queryKeys } from '@/api/query_keys';
import { FileType } from '@/api/asset_interfaces';
import type { PublicAssetResponse } from './interface';

export const prefetchAssetCheck = async (
  { assetId, fileType, jwtToken }: { assetId: string; fileType: FileType; jwtToken: string },
  queryClientProp?: QueryClient
): Promise<{ queryClient: QueryClient; res: PublicAssetResponse | null }> => {
  const queryClient = queryClientProp || new QueryClient();

  try {
    const res = await getAssetCheck_server({ jwtToken, type: fileType, id: assetId });

    await queryClient.prefetchQuery({
      ...queryKeys.assetCheck(assetId, fileType),
      //  queryFn: () => getAssetCheck({ type: fileType, id: assetId }),
      initialData: res
    });

    return { queryClient, res };
  } catch (error) {
    console.error(error);
    return { queryClient, res: null };
  }
};

export const useAssetCheck = <TData = PublicAssetResponse>(
  {
    assetId,
    fileType
  }: {
    assetId: string | undefined;
    fileType: FileType | undefined;
  },
  select?: (d: PublicAssetResponse) => TData
) => {
  return useQuery({
    ...queryKeys.assetCheck(assetId || '', fileType || 'metric'),
    queryFn: () => getAssetCheck({ type: fileType!, id: assetId! }),
    enabled: true,
    select
  });
};
