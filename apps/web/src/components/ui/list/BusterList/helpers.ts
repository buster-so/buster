import type { BusterListRowItem } from './interfaces';

export const getAllIdsInSection = (rows: BusterListRowItem[], sectionId: string) => {
  const sectionIndex = rows.findIndex((row) => row.id === sectionId);
  if (sectionIndex === -1) return [];

  const ids: string[] = [];

  // Start from the row after the section
  for (let i = sectionIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    // Stop if we hit another section row
    if (row.rowSection) break;
    ids.push(row.id);
  }

  return ids;
};
