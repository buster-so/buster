import { UserOverviewController } from './_overview/UserOverviewController';

export default async function Page({ params: { userId } }: { params: { userId: string } }) {
  return <UserOverviewController userId={userId} />;
}
