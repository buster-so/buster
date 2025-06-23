import { DashboardLayout } from '@/layouts/DashboardLayout';

export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ dashboardId: string }>;
}) {
  const { dashboardId } = await params;

  return <DashboardLayout dashboardId={dashboardId}>{children}</DashboardLayout>;
}
