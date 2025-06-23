import type { FileType } from '@/api/asset_interfaces';

export type SelectedFile = {
  id: string;
  type: FileType;
  versionNumber: number | undefined; // will be undefined for reasoning files
};

export type ChatLayoutView = 'chat-only' | 'chat-hidden' | 'file-only' | 'both';
