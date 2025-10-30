export function buildCheckRunKey(checkRunId: number, owner: string, repo: string): string {
  return `${checkRunId}@${owner}/${repo}`;
}
