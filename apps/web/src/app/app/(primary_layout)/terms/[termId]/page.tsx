import { TermIndividualController } from '@/controllers/TermIndividualController';

const termPageIdDefaultLayout = ['auto', '300px'];

export default async function TermIdPage(props: { params: Promise<{ termId: string }> }) {
  const params = await props.params;

  const { termId } = params;

  return (
    <TermIndividualController termPageIdDefaultLayout={termPageIdDefaultLayout} termId={termId} />
  );
}
