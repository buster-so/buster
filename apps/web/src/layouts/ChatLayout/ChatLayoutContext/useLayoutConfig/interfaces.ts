export interface FileConfig {
  selectedFileView: FileView;
  fileViewConfig?: FileViewConfig;
}

export type FileViewConfig = Partial<
  Record<
    FileView,
    {
      secondaryView: FileViewSecondary;
    }
  >
>;

export type FileView =
  | MetricFileView
  | DashboardFileView
  | TermFileView
  | ValueFileView
  | DatasetFileView
  | CollectionFileView
  | ReasoningFileView
  | ReportFileView;

export type MetricFileView = 'chart' | 'results' | 'file' | 'sql';
export type DashboardFileView = 'dashboard' | 'file';
export type TermFileView = 'file';
export type ValueFileView = 'file';
export type DatasetFileView = 'file';
export type CollectionFileView = 'file' | 'results';
export type ReportFileView = 'report' | 'file';
export type ReasoningFileView = 'reasoning';

export type MetricFileViewSecondary = 'chart-edit' | 'version-history';
export type DashboardFileViewSecondary = 'version-history';
export type FileViewSecondary = null | MetricFileViewSecondary | DashboardFileViewSecondary;
