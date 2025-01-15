export default function Page({
  params: { teamId }
}: {
  params: {
    teamId: string;
  };
}) {
  return <div>Team {teamId}</div>;
}
