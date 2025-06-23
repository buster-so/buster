import { DashboardViewFileController } from '@/controllers/DashboardController/DashboardViewFileController';

export default async function Page({
  params
}: {
  params: Promise<{ dashboardId: string; chatId: string }>;
}) {
  const { dashboardId, chatId } = await params;

  return <DashboardViewFileController dashboardId={dashboardId} chatId={chatId} />;
}
