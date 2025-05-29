import { AppPageLayout } from '@/components/ui/layouts';
import { HomePageController, HomePageHeader } from '@/controllers/HomePage';
import React from 'react';

export default function HomePage() {
  return (
    <AppPageLayout header={<HomePageHeader />}>
      <HomePageController />
    </AppPageLayout>
  );
}
