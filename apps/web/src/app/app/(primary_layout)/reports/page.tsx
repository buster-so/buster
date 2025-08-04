import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { ReportsListController } from '@/controllers/ReportsListController';
import type { Metadata } from 'next';
import { Text } from '@/components/ui/typography';

export const metadata: Metadata = {
  title: 'Reports'
};

export default function ReportsPage() {
  return (
    <AppPageLayout headerSizeVariant="list" header={<Text>Reports</Text>}>
      <ReportsListController />
    </AppPageLayout>
  );
}
