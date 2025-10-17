import {
  type Ancestor,
  AncestorSchema,
  TextSearchResultSchema,
} from '@buster/database/schema-types';
import { z } from 'zod';
import { UserInfoResponseSchema } from '../access-controls';
import { AssetTypeSchema } from '../assets';
import {
  PaginatedRequestSchema,
  SearchPaginatedResponseSchema,
} from '../type-utilities/pagination';

export const AssetAncestorsSchema = z.object({
  chats: z.array(AncestorSchema),
  dashboards: z.array(AncestorSchema),
  reports: z.array(AncestorSchema),
  collections: z.array(AncestorSchema),
});

/**
 * Request schema for text search endpoint
 */
export const SearchTextRequestSchema = z
  .object({
    query: z.string().optional(),
    assetTypes: z.union([AssetTypeSchema, z.array(AssetTypeSchema)]).optional(),
    includeAssetAncestors: z
      .preprocess((val) => {
        if (typeof val === 'string') {
          return val.toLowerCase() === 'true';
        }
        return Boolean(val);
      }, z.boolean())
      .default(false)
      .optional(),
    includeScreenshots: z
      .preprocess((val) => {
        if (typeof val === 'string') {
          return val.toLowerCase() === 'true';
        }
        return Boolean(val);
      }, z.boolean())
      .default(false)
      .optional(),
    endDate: z.string().datetime().optional(),
    startDate: z.string().datetime().optional(),
  })
  .merge(PaginatedRequestSchema);

export const SearchTextDataSchema = TextSearchResultSchema.extend({
  ancestors: AssetAncestorsSchema.optional(),
  screenshotUrl: z.string().optional(),
});

export type { AssetAncestors } from '@buster/database/schema-types';
export { type Ancestor, AncestorSchema };
export type SearchTextRequest = z.infer<typeof SearchTextRequestSchema>;
export type SearchTextData = z.infer<typeof SearchTextDataSchema>;
export const SearchTextResponseSchema = SearchPaginatedResponseSchema(SearchTextDataSchema);
export type SearchTextResponse = z.infer<typeof SearchTextResponseSchema>;
