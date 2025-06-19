import type { ShareAssetType } from '../share';

export interface BusterSearchResult {
  id: string;
  highlights: string[];
  name: string;
  updated_at: string;
  type: ShareAssetType;
  score: number;
}
