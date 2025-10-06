import Fuse from 'fuse.js';
import type { MentionInputTriggerItem, MentionTriggerItem } from './MentionInput.types';

// Fuse.js configuration for consistent fuzzy search settings
const fuseConfig = {
  threshold: 0.3, // Conservative fuzzy matching (0.0 = exact, 1.0 = very fuzzy)
  includeScore: false,
  minMatchCharLength: 1,
  ignoreLocation: true, // Don't care about position of match in string
  findAllMatches: true,
};

// Core filter logic for individual items using Fuse.js
const itemMatchesQuery = (item: MentionTriggerItem, query: string): boolean => {
  // Preserve original behavior: if labelMatches exists, ONLY search in labelMatches
  if (item.labelMatches?.length) {
    const labelMatchesFuse = new Fuse(item.labelMatches, fuseConfig);
    const results = labelMatchesFuse.search(query);
    return results.length > 0;
  }

  // Fall back to checking the label if it's a string and no labelMatches
  if (typeof item.label === 'string') {
    const labelFuse = new Fuse([item.label], fuseConfig);
    const results = labelFuse.search(query);
    return results.length > 0;
  }

  if (typeof item.pillLabel === 'string') {
    const pillLabelFuse = new Fuse([item.pillLabel], fuseConfig);
    const results = pillLabelFuse.search(query);
    return results.length > 0;
  }

  // No match if label is not a string and no labelMatches provided
  return false;
};

// Clean up separators (remove consecutive, leading, and trailing)
const cleanupSeparators = (items: MentionInputTriggerItem[]): MentionInputTriggerItem[] => {
  if (items.length === 0) return [];

  const cleaned: MentionInputTriggerItem[] = [];
  let lastWasSeparator = false;

  for (const item of items) {
    const isSeparator = item.type === 'separator';

    // Skip separator if it would be first, or if last item was separator
    if (isSeparator && (cleaned.length === 0 || lastWasSeparator)) {
      continue;
    }

    cleaned.push(item);
    lastWasSeparator = isSeparator;
  }

  // Remove trailing separator if present
  if (cleaned.length > 0 && cleaned[cleaned.length - 1].type === 'separator') {
    cleaned.pop();
  }

  return cleaned;
};

export const defaultQueryMentionsFilter = (
  query: string,
  items: MentionInputTriggerItem[]
): MentionInputTriggerItem[] => {
  // Return all items if no query
  if (!query) {
    return items;
  }

  // Filter items and groups
  const filtered: MentionInputTriggerItem[] = [];

  for (const item of items) {
    // Handle separators - add them for now, clean up later
    if (item.type === 'separator') {
      filtered.push(item);
      continue;
    }

    // Handle groups - only include if they have matching items
    if (item.type === 'group') {
      const matchingItems = item.items.filter((groupItem) => itemMatchesQuery(groupItem, query));

      // Only include group if it has matching items
      if (matchingItems.length > 0) {
        filtered.push({
          ...item,
          items: matchingItems,
        });
      }
      continue;
    }

    // Handle regular items (type === 'item' or undefined)
    if (!item.type || item.type === 'item') {
      if (itemMatchesQuery(item as MentionTriggerItem, query)) {
        filtered.push(item);
      }
    }
  }

  // Clean up separators (remove consecutive, leading, trailing)
  const cleaned = cleanupSeparators(filtered);

  return cleaned;
};
