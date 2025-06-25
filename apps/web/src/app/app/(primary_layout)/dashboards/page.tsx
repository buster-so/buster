import { DashboardListController } from '@/controllers/DashboardListController';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboards'
};

export default function DashboardPage() {
  return <DashboardListController />;
}
