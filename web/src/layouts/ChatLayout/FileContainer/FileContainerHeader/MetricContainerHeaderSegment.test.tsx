import { render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { useIsMetricReadOnly } from '@/context/Metrics/useIsMetricReadOnly';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { MetricContainerHeaderSegment } from './MetricContainerHeaderSegment';

// Mock the hooks
vi.mock('@/context/Metrics/useIsMetricReadOnly');
vi.mock('../../ChatLayoutContext');
vi.mock('@/api/buster_rest/metrics');
vi.mock('@/components/ui/typography', () => ({
  Text: ({ children, ...props }: React.PropsWithChildren<any>) => (
    <div data-testid="mock-text" {...props}>
      {children}
    </div>
  )
}));
vi.mock('@/components/ui/segmented', () => ({
  AppSegmented: ({ options, value }: any) => (
    <div data-testid="mock-segmented" data-options={JSON.stringify(options)} data-value={value} />
  )
}));

describe('MetricContainerHeaderSegment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render null when data is not fetched', () => {
    (useIsMetricReadOnly as any).mockReturnValue({
      isFetched: false,
      isError: false,
      isViewingOldVersion: false
    });

    const { container } = render(
      <MetricContainerHeaderSegment
        selectedFileId="metric-123"
        selectedFileView="chart"
        chatId="chat-123"
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should render null when there is an error', () => {
    (useIsMetricReadOnly as any).mockReturnValue({
      isFetched: true,
      isError: true,
      isViewingOldVersion: false
    });

    const { container } = render(
      <MetricContainerHeaderSegment
        selectedFileId="metric-123"
        selectedFileView="chart"
        chatId="chat-123"
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should render MetricOldVersion when viewing old version', () => {
    (useIsMetricReadOnly as any).mockReturnValue({
      isFetched: true,
      isError: false,
      isViewingOldVersion: true
    });

    render(
      <MetricContainerHeaderSegment
        selectedFileId="metric-123"
        selectedFileView="chart"
        chatId="chat-123"
      />
    );

    expect(screen.getByTestId('mock-text')).toBeInTheDocument();
    expect(screen.getByTestId('mock-text')).toHaveTextContent(
      'You are viewing an old version of this metric'
    );
  });

  it('should render MetricSegments with proper options when not in a chat', () => {
    (useIsMetricReadOnly as any).mockReturnValue({
      isFetched: true,
      isError: false,
      isViewingOldVersion: false
    });

    (useChatLayoutContextSelector as any).mockReturnValue('metric-123');
    (useGetMetric as any).mockReturnValue({ error: null });

    render(
      <MetricContainerHeaderSegment
        selectedFileId="metric-123"
        selectedFileView="chart"
        chatId=""
      />
    );

    const segmented = screen.getByTestId('mock-segmented');
    expect(segmented).toBeInTheDocument();
    expect(segmented).toHaveAttribute('data-value', 'chart');

    const options = JSON.parse(segmented.getAttribute('data-options') || '[]');
    expect(options).toHaveLength(3);
    expect(options[0].label).toBe('Chart');
    expect(options[1].label).toBe('Results');
    expect(options[2].label).toBe('SQL');
    expect(options[0].link).toContain('app/metrics/metric-123/chart');
  });

  it('should render MetricSegments with chat routes when chatId is provided', () => {
    (useIsMetricReadOnly as any).mockReturnValue({
      isFetched: true,
      isError: false,
      isViewingOldVersion: false
    });

    (useChatLayoutContextSelector as any).mockReturnValue('metric-123');
    (useGetMetric as any).mockReturnValue({ error: null });

    render(
      <MetricContainerHeaderSegment
        selectedFileId="metric-123"
        selectedFileView="results"
        chatId="chat-456"
      />
    );

    const segmented = screen.getByTestId('mock-segmented');
    expect(segmented).toBeInTheDocument();
    expect(segmented).toHaveAttribute('data-value', 'results');

    const options = JSON.parse(segmented.getAttribute('data-options') || '[]');
    expect(options).toHaveLength(3);
    expect(options[0].link).toContain('app/chats/chat-456/metrics/metric-123/chart');
    expect(options[1].link).toContain('app/chats/chat-456/metrics/metric-123/results');
  });
});
