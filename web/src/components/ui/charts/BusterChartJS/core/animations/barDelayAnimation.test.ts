import { barDelayAnimation } from './barDelayAnimation';
import type { Chart, ScriptableContext } from 'chart.js';

describe('barDelayAnimation', () => {
  test('should calculate correct delay for regular bar chart', () => {
    const animation = barDelayAnimation({ barGroupType: 'group', maxDelay: 1000 });

    // Mock chart context
    const context = {
      type: 'data',
      mode: 'default',
      dataIndex: 1,
      datasetIndex: 2,
      chart: {
        id: 'test-chart-1',
        data: {
          datasets: [{ data: [1, 2, 3] }, { data: [4, 5, 6] }, { data: [7, 8, 9] }]
        }
      } as unknown as Chart,
      active: true,
      dataset: { data: [7, 8, 9] },
      parsed: 8,
      raw: 8
    } as unknown as ScriptableContext<'bar'>;

    // Calculate expected delay
    // For 3 datasets with 3 data points each, total segments = 8 (9-1)
    // Scaling factor = 1000 / 8 = 125
    // Position = (2 * 3 + 1) = 7
    // Expected delay = 7 * 125 = 875
    const delay = animation.delay?.(context);
    expect(delay).toBe(875);
  });

  test('should return zero delay for percentage-stack chart type', () => {
    const animation = barDelayAnimation({ barGroupType: 'percentage-stack', maxDelay: 1000 });

    const context = {
      type: 'data',
      mode: 'default',
      dataIndex: 0,
      datasetIndex: 0,
      chart: {
        id: 'test-chart-2',
        data: {
          datasets: [{ data: [1, 2, 3] }, { data: [4, 5, 6] }]
        }
      } as unknown as Chart,
      active: true,
      dataset: { data: [1, 2, 3] },
      parsed: 1,
      raw: 1
    } as unknown as ScriptableContext<'bar'>;

    const delay = animation.delay?.(context);
    expect(delay).toBe(0);
  });
});
