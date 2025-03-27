import { AppPageLayout } from '@/components/ui/layouts';
import React from 'react';
import { HomePageController, HomePageHeader } from '@/controllers/HomePage';

export default function HomePage() {
  return (
    <AppPageLayout header={<HomePageHeader />}>
      <HomePageController />
    </AppPageLayout>
  );
}
