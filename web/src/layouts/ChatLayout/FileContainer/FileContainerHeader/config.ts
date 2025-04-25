import { FileType } from '@/api/asset_interfaces/chat';
import type { FileContainerButtonsProps, FileContainerSegmentProps } from './interfaces';
import { MetricContainerHeaderButtons } from './MetricContainerHeaderButtons';
import { DashboardContainerHeaderButtons } from './DashboardContainerHeaderButtons/index';
import { DashboardContainerHeaderSegment } from './DashboardContainerHeaderSegment/index';
import { MetricContainerHeaderSegment } from './MetricContainerHeaderSegment';
import { ReasoningContainerHeaderSegment } from './ReasoningContainerHeaderSegment';
import React from 'react';

export const SelectedFileSegmentRecord: Record<FileType, React.FC<FileContainerSegmentProps>> = {
  metric: MetricContainerHeaderSegment,
  dashboard: DashboardContainerHeaderSegment,
  reasoning: ReasoningContainerHeaderSegment
  // value: ValueContainerHeaderSegment,
  // term: TermContainerHeaderSegment,
  // dataset: DatasetContainerHeaderSegment,
  // collection: CollectionContainerHeaderSegment
};

export const SelectedFileButtonsRecord: Record<FileType, React.FC<FileContainerButtonsProps>> = {
  metric: MetricContainerHeaderButtons,
  dashboard: DashboardContainerHeaderButtons,
  reasoning: () => null
  // value: ValueContainerHeaderButtons,
  // term: TermContainerHeaderButtons,
  // dataset: DatasetContainerHeaderButtons,
  // collection: CollectionContainerHeaderButtons
};
