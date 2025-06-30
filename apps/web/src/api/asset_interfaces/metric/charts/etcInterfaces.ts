import { z } from 'zod/v4';

// OPTIONAL: default is no sorting (none). The first item in the array will be the primary sort. The second item will be the secondary sort. This will only apply if the X axis type is not a date.
export const BarSortBySchema = z.array(z.enum(['asc', 'desc', 'none'])).default([]);

// OPTIONAL: default: value
export const PieSortBySchema = z.union([z.enum(['value', 'key']), z.null()]).default('value');

// current is used for line charts with
export const ShowLegendHeadlineSchema = z
  .union([z.literal(false), z.enum(['current', 'average', 'total', 'median', 'min', 'max'])])
  .default(false);

// Export inferred types
export type BarSortBy = z.infer<typeof BarSortBySchema>;
export type PieSortBy = z.infer<typeof PieSortBySchema>;
export type ShowLegendHeadline = z.infer<typeof ShowLegendHeadlineSchema>;
