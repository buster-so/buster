import { AppPageLayout } from '@/components/ui/layouts';
import { HomePageController, HomePageHeader } from '@/controllers/HomePage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home'
};

export default function HomePage() {
  return (
    <AppPageLayout header={<HomePageHeader />}>
      <HomePageController />
    </AppPageLayout>
  );
}
