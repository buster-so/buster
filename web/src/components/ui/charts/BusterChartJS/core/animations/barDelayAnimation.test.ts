import type { Chart, ScriptableContext } from 'chart.js';
import { barDelayAnimation } from './barDelayAnimation';

describe('barDelayAnimation', () => {
  test('should calculate correct delay for regular bar chart', () => {
    const animation = barDelayAnimation({
      barGroupType: 'group',
      maxDelayBetweenDatasets: 500,
      maxDelayBetweenDataPoints: 200
    });

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
    // datasetIndex = 2, dataIndex = 1
    // delay = 2 * 500 + 1 * 200 = 1200
    // Expected delay = 1200
    const delay = animation.delay?.(context);
    expect(delay).toBe(1200);
  });

  test('should return zero delay for percentage-stack chart type', () => {
    const animation = barDelayAnimation({
      barGroupType: 'percentage-stack',
      maxDelayBetweenDatasets: 500,
      maxDelayBetweenDataPoints: 200
    });

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
