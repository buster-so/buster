import { DashboardViewFileController } from '@/controllers/DashboardController/DashboardViewFileController';

export default async function Page({ params }: { params: Promise<{ dashboardId: string }> }) {
  const { dashboardId } = await params;

  return <DashboardViewFileController dashboardId={dashboardId} chatId={undefined} />;
}
