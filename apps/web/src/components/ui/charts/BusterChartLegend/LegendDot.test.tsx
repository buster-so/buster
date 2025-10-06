import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LegendItemDot } from './LegendDot';
import '@testing-library/jest-dom';

describe('LegendItemDot', () => {
  const defaultProps = {
    color: '#FF0000',
    inactive: false,
    type: 'bar',
  } as Parameters<typeof LegendItemDot>[0];

  it('renders with default props', () => {
    render(<LegendItemDot {...defaultProps} />);
    const dot = screen.getByTestId('legend-dot');
    expect(dot).toHaveStyle({ backgroundColor: '#FF0000' });
  });

  it('renders with different chart types', () => {
    const { rerender } = render(<LegendItemDot {...defaultProps} type={'bar'} />);
    expect(screen.getByTestId('legend-dot')).toHaveClass('rounded-sm');

    rerender(<LegendItemDot {...defaultProps} type={'line'} />);
    expect(screen.getByTestId('legend-dot')).toHaveClass('rounded-sm');

    rerender(<LegendItemDot {...defaultProps} type={'scatter'} />);
    expect(screen.getByTestId('legend-dot')).toHaveClass('rounded-full');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LegendItemDot {...defaultProps} size="default" />);
    expect(screen.getByTestId('legend-dot-container')).toHaveClass('w-4');

    rerender(<LegendItemDot {...defaultProps} size="sm" />);
    expect(screen.getByTestId('legend-dot-container')).toHaveClass('w-2');
  });

  it('handles inactive state', () => {
    render(<LegendItemDot {...defaultProps} inactive={true} />);
    const dot = screen.getByTestId('legend-dot');
    expect(dot).not.toHaveStyle({ backgroundColor: '#FF0000' });
  });

  it('calls onFocusItem when clicked', () => {
    const onFocusItem = vi.fn();
    render(<LegendItemDot {...defaultProps} onFocusItem={onFocusItem} />);

    const dot = screen.getByTestId('legend-dot');
    fireEvent.click(dot);

    expect(onFocusItem).toHaveBeenCalledTimes(1);
  });

  it('shows focus target on hover when onFocusItem is provided', () => {
    const onFocusItem = vi.fn();
    render(<LegendItemDot {...defaultProps} onFocusItem={onFocusItem} />);

    const container = screen.getByTestId('legend-dot-container');
    fireEvent.mouseEnter(container);

    // The target icon should be visible on hover
    expect(screen.getByTestId('focus-target')).toBeInTheDocument();
  });

  it('does not show focus target when onFocusItem is not provided', () => {
    render(<LegendItemDot {...defaultProps} />);

    const container = screen.getByTestId('legend-dot-container');
    fireEvent.mouseEnter(container);

    // The target icon should not be present
    expect(screen.queryByTestId('focus-target')).not.toBeInTheDocument();
  });

  it('stops event propagation when clicked with onFocusItem', () => {
    const onFocusItem = vi.fn();
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <LegendItemDot {...defaultProps} onFocusItem={onFocusItem} />
      </div>
    );

    const dot = screen.getByTestId('legend-dot');
    fireEvent.click(dot);

    expect(onFocusItem).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();
  });
});
