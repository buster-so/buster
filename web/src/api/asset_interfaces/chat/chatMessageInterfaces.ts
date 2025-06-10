import type { FileType, ReasoningThoughtFileType, ReasoningFileType } from './config';

export type BusterChatMessage = {
  id: string;
  request_message: BusterChatMessageRequest | null;
  response_message_ids: string[];
  response_messages: Record<string, BusterChatMessageResponse>;
  reasoning_message_ids: string[];
  reasoning_messages: Record<string, BusterChatMessageReasoning>;
  created_at: string;
  final_reasoning_message: string | null;
  feedback: 'negative' | null;
};

export type BusterChatMessageRequest = null | {
  request: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
};

export type BusterChatMessageResponse =
  | BusterChatResponseMessage_text
  | BusterChatResponseMessage_file;

export type BusterChatResponseMessage_text = {
  id: string;
  type: 'text';
  message: string;
  message_chunk?: string;
  is_final_message: boolean;
};

export type BusterChatMessageReasoning_status = 'loading' | 'completed' | 'failed';

export type BusterChatResponseMessage_fileMetadata = {
  status: BusterChatMessageReasoning_status;
  message: string;
  timestamp?: number;
};

export type BusterChatResponseMessage_file = {
  id: string;
  type: 'file';
  file_type: FileType;
  file_name: string;
  version_number: number;
  filter_version_id: string | null;
  metadata?: BusterChatResponseMessage_fileMetadata[];
};

export type BusterChatMessageReasoning =
  | BusterChatMessageReasoning_pills
  | BusterChatMessageReasoning_text
  | BusterChatMessageReasoning_files;

export type BusterChatMessageReasoning_pill = {
  text: string;
  type: ReasoningThoughtFileType | null; //if null then the pill will not link anywhere
  id: string;
};

export type BusterChatMessageReasoning_pillContainer = {
  title: string;
  pills: BusterChatMessageReasoning_pill[];
};

export type BusterChatMessageReasoning_pills = {
  id: string;
  type: 'pills';
  title: string;
  secondary_title: string | undefined;
  pill_containers: BusterChatMessageReasoning_pillContainer[];
  status: BusterChatMessageReasoning_status; //if left undefined, will automatically be set to 'loading' if the chat stream is in progress AND there is no message after it
};

export type BusterChatMessageReasoning_text = {
  id: string;
  type: 'text';
  title: string;
  secondary_title: string | undefined;
  message?: string;
  message_chunk?: string;
  status: BusterChatMessageReasoning_status;
  finished_reasoning?: boolean;
};

export type BusterChatMessageReasoning_file = {
  id: string;
  file_type: ReasoningFileType;
  file_name: string;
  version_number: number;
  status: BusterChatMessageReasoning_status;
  file: {
    text: string | undefined;
    text_chunk?: string | undefined;
    modified?: [number, number][];
  };
};

export type BusterChatMessageReasoning_files = {
  id: string;
  type: 'files';
  title: string;
  status: BusterChatMessageReasoning_status;
  secondary_title: string | undefined;
  file_ids: string[];
  files: Record<string, BusterChatMessageReasoning_file>;
};
