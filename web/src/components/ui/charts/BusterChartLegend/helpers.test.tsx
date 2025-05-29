import { ChartType } from '@/api/asset_interfaces/metric/charts';
import { renderToString } from 'react-dom/server';
import { LegendItem } from './LegendItem';
import { computeHiddenShowItems } from './helpers';
import type { BusterChartLegendItem } from './interfaces';

// Mock the DOM elements and methods
const mockGetBoundingClientRect = jest.fn();
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

// Mock renderToString to return a predictable width
jest.mock('react-dom/server', () => ({
  renderToString: jest.fn(() => '<div style="width: 100px">Mock Item</div>')
}));

describe('computeHiddenShowItems', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup DOM mocks
    mockGetBoundingClientRect.mockReturnValue({ width: 100 });
    mockCreateElement.mockReturnValue({
      style: {},
      getBoundingClientRect: mockGetBoundingClientRect,
      innerHTML: ''
    });

    // Mock document methods
    document.createElement = mockCreateElement;
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;
  });

  it('should return empty arrays when width is 0', () => {
    const result = computeHiddenShowItems([], 0);
    expect(result).toEqual({
      shownItems: [],
      hiddenItems: []
    });
  });

  it('should return empty arrays when legendItems is empty', () => {
    const result = computeHiddenShowItems([], 100);
    expect(result).toEqual({
      shownItems: [],
      hiddenItems: []
    });
  });

  it('should return empty arrays when legendItems is null', () => {
    const result = computeHiddenShowItems(null as any, 100);
    expect(result).toEqual({
      shownItems: [],
      hiddenItems: []
    });
  });

  it('should show all items when container is wide enough', () => {
    const items: BusterChartLegendItem[] = [
      {
        color: '#000',
        inactive: false,
        type: ChartType.Line,
        formattedName: 'Item 1',
        id: '1',
        data: [],
        yAxisKey: 'y1'
      },
      {
        color: '#fff',
        inactive: false,
        type: ChartType.Line,
        formattedName: 'Item 2',
        id: '2',
        data: [],
        yAxisKey: 'y2'
      }
    ];

    // Container width is enough for both items (100px each + 8px spacing)
    const result = computeHiddenShowItems(items, 300);

    expect(result.shownItems).toHaveLength(2);
    expect(result.hiddenItems).toHaveLength(0);
    expect(result.shownItems).toEqual(items);
  });

  it('should hide items that exceed container width', () => {
    const items: BusterChartLegendItem[] = [
      {
        color: '#000',
        inactive: false,
        type: ChartType.Line,
        formattedName: 'Item 1',
        id: '1',
        data: [],
        yAxisKey: 'y1'
      },
      {
        color: '#fff',
        inactive: false,
        type: ChartType.Line,
        formattedName: 'Item 2',
        id: '2',
        data: [],
        yAxisKey: 'y2'
      },
      {
        color: '#ccc',
        inactive: false,
        type: ChartType.Line,
        formattedName: 'Item 3',
        id: '3',
        data: [],
        yAxisKey: 'y3'
      }
    ];

    // Container width only fits one item (100px) plus overflow width (79px)
    const result = computeHiddenShowItems(items, 200);

    expect(result.shownItems).toHaveLength(1);
    expect(result.hiddenItems).toHaveLength(2);
    expect(result.shownItems[0]).toEqual(items[0]);
    expect(result.hiddenItems).toEqual([items[1], items[2]]);
  });

  it('should properly handle spacing between items', () => {
    const items: BusterChartLegendItem[] = [
      {
        color: '#000',
        inactive: false,
        type: ChartType.Line,
        formattedName: 'Item 1',
        id: '1',
        data: [],
        yAxisKey: 'y1'
      },
      {
        color: '#fff',
        inactive: false,
        type: ChartType.Line,
        formattedName: 'Item 2',
        id: '2',
        data: [],
        yAxisKey: 'y2'
      }
    ];

    // Container width fits both items (100px each) plus spacing (8px) plus overflow (79px)
    const result = computeHiddenShowItems(items, 287);

    expect(result.shownItems).toHaveLength(2);
    expect(result.hiddenItems).toHaveLength(0);
  });

  it('should clean up DOM elements after computation', () => {
    const items: BusterChartLegendItem[] = [
      {
        color: '#000',
        inactive: false,
        type: ChartType.Line,
        formattedName: 'Item 1',
        id: '1',
        data: [],
        yAxisKey: 'y1'
      }
    ];

    computeHiddenShowItems(items, 200);

    expect(mockAppendChild).toHaveBeenCalledTimes(1);
    expect(mockRemoveChild).toHaveBeenCalledTimes(1);
  });
});
