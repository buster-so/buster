/**
 * Get preview lines from content based on expansion state
 */
export function getPreviewLines(content: string, maxLines: number, isExpanded: boolean): string[] {
  const lines = content.split('\n');
  return isExpanded ? lines : lines.slice(0, maxLines);
}

/**
 * Get last N lines from content (for command output)
 */
export function getLastLines(content: string, maxLines: number, isExpanded: boolean): string[] {
  const lines = content.split('\n').filter(Boolean);
  return isExpanded ? lines : lines.slice(-maxLines);
}
