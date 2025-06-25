import { CollectionListController } from '@/controllers/CollectionListController';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections'
};

export default function CollectionsPage() {
  return <CollectionListController />;
}
