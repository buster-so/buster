import { CollectionIndividualController } from '@controllers/CollectionIndividualController';

export default async function CollectionIdPage(props: { params: Promise<{ collectionId: string }> }) {
  const params = await props.params;
  const { collectionId } = params;

  return <CollectionIndividualController collectionId={collectionId} />;
}
