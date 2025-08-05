import type { FileType } from '@/api/asset_interfaces/chat';
import { DashboardContainerHeaderButtons } from './DashboardContainerHeaderButtons';
import { DashboardContainerHeaderSegment } from './DashboardContainerHeaderSegment';
import type { FileContainerButtonsProps, FileContainerSegmentProps } from './interfaces';
import { MetricContainerHeaderButtons } from './MetricContainerHeaderButtons';
import { MetricContainerHeaderSegment } from './MetricContainerHeaderSegment';
import { ReasoningContainerHeaderSegment } from './ReasoningContainerHeaderSegment';
import { ReportContainerHeaderSegment } from './ReportContainerHeaderSegment';

export const SelectedFileSegmentRecord: Record<FileType, React.FC<FileContainerSegmentProps>> = {
  metric: MetricContainerHeaderSegment,
  dashboard: DashboardContainerHeaderSegment,
  reasoning: ReasoningContainerHeaderSegment,
  report: ReportContainerHeaderSegment
  // value: ValueContainerHeaderSegment,
  // term: TermContainerHeaderSegment,
  // dataset: DatasetContainerHeaderSegment,
  // collection: CollectionContainerHeaderSegment
};

export const SelectedFileButtonsRecord: Record<FileType, React.FC<FileContainerButtonsProps>> = {
  metric: MetricContainerHeaderButtons,
  dashboard: DashboardContainerHeaderButtons,
  report: () => <div>TODO: Report buttons</div>,
  reasoning: () => null
  // value: ValueContainerHeaderButtons,
  // term: TermContainerHeaderButtons,
  // dataset: DatasetContainerHeaderButtons,
  // collection: CollectionContainerHeaderButtons
};
