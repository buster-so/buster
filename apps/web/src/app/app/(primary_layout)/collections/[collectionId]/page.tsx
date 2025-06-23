import { CollectionIndividualController } from '@/controllers/CollectionIndividualController';
import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export default async function CollectionIdPage(props: {
  params: Promise<{ collectionId: string }>;
}) {
  const params = await props.params;
  const { collectionId } = params;

  return (
    <AppAssetCheckLayout assetId={collectionId} type="collection">
      <CollectionIndividualController collectionId={collectionId} />
    </AppAssetCheckLayout>
  );
}
