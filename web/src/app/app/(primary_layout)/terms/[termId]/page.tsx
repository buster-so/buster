import { getAppSplitterLayout } from '@/components/ui/layouts';
import { TermIndividualController } from '@/controllers/TermIndividualController';

export default async function TermIdPage(props: { params: Promise<{ termId: string }> }) {
  const params = await props.params;

  const { termId } = params;

  const termPageIdLayout = await getAppSplitterLayout('term-page', ['auto', '300px']);

  return <TermIndividualController termPageIdLayout={termPageIdLayout} termId={termId} />;
}
