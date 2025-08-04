//import { ReportsListController } from '@/controllers/ReportsListController';

export default async function Page(props: { params: Promise<{ reportId: string }> }) {
  const params = await props.params;

  const { reportId } = params;

  return <div>Report with an id of {reportId}</div>;
}
