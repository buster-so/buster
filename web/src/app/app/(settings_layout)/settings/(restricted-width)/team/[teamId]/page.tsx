export default async function Page(
  props: {
    params: Promise<{
      teamId: string;
    }>;
  }
) {
  const params = await props.params;

  const {
    teamId
  } = params;

  return <div>Team {teamId}</div>;
}
