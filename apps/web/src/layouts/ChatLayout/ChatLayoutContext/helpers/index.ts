import type { FileType } from '@/api/asset_interfaces/chat';
import type { FileView } from '../useLayoutConfig';

export * from './getFileViewFromRoute';

export const DEFAULT_FILE_VIEW: Record<FileType, FileView> = {
  metric: 'chart',
  dashboard: 'dashboard',
  reasoning: 'reasoning',
  report: 'report'
  // collection: 'results',
  // value: 'results',
  // term: 'results',
  // dataset: 'results',
};
