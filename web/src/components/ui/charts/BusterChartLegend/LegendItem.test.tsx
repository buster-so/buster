import { ChartType } from '@/api/asset_interfaces/metric/charts';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { LegendItem } from './LegendItem';
import type { BusterChartLegendItem } from './interfaces';

describe('LegendItem', () => {
  const mockItem: BusterChartLegendItem = {
    formattedName: 'Test Item',
    color: '#FF0000',
    type: ChartType.Line,
    inactive: false,
    data: [],
    id: 'test-1',
    yAxisKey: 'test'
  };

  const mockItemWithHeadline: BusterChartLegendItem = {
    ...mockItem,
    headline: {
      type: 'current',
      titleAmount: '100'
    }
  };

  it('renders basic legend item correctly', () => {
    render(<LegendItem item={mockItem} />);

    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('renders legend item with headline correctly', () => {
    render(<LegendItem item={mockItemWithHeadline} />);

    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Cur.')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClickMock = jest.fn();
    render(<LegendItem item={mockItem} onClickItem={onClickMock} />);

    fireEvent.click(screen.getByText('Test Item'));
    expect(onClickMock).toHaveBeenCalledWith(mockItem);
  });

  it('handles hover events', () => {
    const onHoverMock = jest.fn();
    render(<LegendItem item={mockItem} onHoverItem={onHoverMock} />);

    const element = screen.getByText('Test Item').parentElement?.parentElement;
    if (element) {
      fireEvent.mouseEnter(element);
      expect(onHoverMock).toHaveBeenCalledWith(mockItem, true);

      fireEvent.mouseLeave(element);
      expect(onHoverMock).toHaveBeenCalledWith(mockItem, false);
    }
  });

  it('handles focus events', () => {
    const onFocusMock = jest.fn();
    render(<LegendItem item={mockItem} onFocusItem={onFocusMock} />);

    // First trigger hover to show the focus target
    const container = screen.getByTestId('legend-dot-container');
    fireEvent.mouseEnter(container);

    // Then click the focus target
    const focusTarget = screen.getByTestId('focus-target');
    fireEvent.click(focusTarget);
    expect(onFocusMock).toHaveBeenCalled();
  });

  it('applies correct styles for inactive state', () => {
    const inactiveItem = { ...mockItem, inactive: true };
    render(<LegendItem item={inactiveItem} />);

    const textElement = screen.getByText('Test Item').parentElement;
    expect(textElement).toHaveClass('text-text-secondary');
  });

  it('applies correct styles for active state', () => {
    render(<LegendItem item={mockItem} />);

    const textElement = screen.getByText('Test Item').parentElement;
    expect(textElement).toHaveClass('text-foreground');
  });

  it('renders different headline types correctly', () => {
    const headlineTypes = ['average', 'total', 'median', 'min', 'max'] as const;

    headlineTypes.forEach((type) => {
      const item = {
        ...mockItem,
        headline: {
          type,
          titleAmount: '100'
        }
      };

      const { unmount } = render(<LegendItem item={item} />);
      expect(screen.getByText('100')).toBeInTheDocument();
      unmount();
    });
  });
});
