import type { Metadata } from 'next';
import { UserOverviewController } from './_overview/UserOverviewController';

export default async function Page(props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;

  const { userId } = params;

  return <UserOverviewController userId={userId} />;
}
