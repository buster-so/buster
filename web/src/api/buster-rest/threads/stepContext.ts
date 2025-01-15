import {
  BusterThought,
  BusterThreadMessage,
  BusterThreadMessageSqlEvaluation,
  BusterThreadStepProgress
} from './interfaces';
import { BusterThreadMessageConfig } from './threadConfigInterfaces';

export type BusterThreadStepBase = {
  thread_id: string;
  message_id: string;
  progress: BusterThreadStepProgress;
};

export type BusterThreadStepEvent_FixingSql = {
  sql: string | null;
  sql_chunk: string | null;
} & BusterThreadStepBase;

export type BusterThreadStepEvent_FetchingData = {
  data: null | Record<string, string | number | number>[];
  data_metadata: BusterThreadMessage['data_metadata'];
  chart_config: BusterThreadMessageConfig;
  title: string;
  description: string;
  time_frame: string;
  dataset_id: string;
  dataset_name: string;
  code: string | null;
} & BusterThreadStepBase;

export type BusterThreadStepEvent_GeneratingMetricTitle = {
  metric_title: string | null;
  metric_title_chunk: string | null;
} & BusterThreadStepBase;

export type BusterThreadStepEvent_GeneratingResponse = {
  text: string | null;
  text_chunk: string | null;
} & BusterThreadStepBase;

export type BusterThreadStepEvent_GeneratingTimeFrame = {
  time_frame: string | null;
  time_frame_chunk: string | null;
} & BusterThreadStepBase;

export type BusterThreadStepEvent_GeneratingDescription = {
  description: string | null;
  description_chunk: string | null;
} & BusterThreadStepBase;

export type BusterThreadStepEvent_Thought = {
  thoughts: BusterThought[];
  title: string;
} & BusterThreadStepBase;

export type BusterThreadStepEvent_SqlEvaluation = {} & BusterThreadStepBase &
  BusterThreadMessageSqlEvaluation;

//TEST

export type BusterThreadStepEvent_MarkdownStream = {
  markdown: string;
  markdown_chunk: string;
} & BusterThreadStepBase;
