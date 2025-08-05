import { ReportPageController } from '@/controllers/ReportPageControllers/ReportPageController';

export default async function Page(props: { params: Promise<{ reportId: string }> }) {
  const params = await props.params;

  const { reportId } = params;

  return <ReportPageController reportId={reportId} />;
}
