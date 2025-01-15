import { BusterShareAssetType } from '../users';

export interface BusterSearchResult {
  id: string;
  highlights: string[];
  name: string;
  updated_at: string;
  type: BusterShareAssetType;
  score: number;
}
