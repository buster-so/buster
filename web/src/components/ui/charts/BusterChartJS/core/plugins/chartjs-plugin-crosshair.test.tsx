import type { Chart, ChartEvent } from 'chart.js';
import { describe, expect, it } from 'vitest';
import crosshairPlugin, { type CrosshairPluginOptions } from './chartjs-plugin-crosshair';

describe('crosshairPlugin', () => {
  it('should update crosshair coordinates on mousemove event', () => {
    // Mock Chart instance
    const mockChart = {
      $crosshair: { x: null, y: null },
      config: { type: 'line' as const }
    } as Chart<'line'>;

    // Mock event args
    const mockEvent: ChartEvent = {
      type: 'mousemove',
      x: 100,
      y: 200,
      native: new MouseEvent('mousemove')
    };

    const args = {
      event: mockEvent,
      replay: false,
      cancelable: false as const,
      inChartArea: true
    };
    const options: CrosshairPluginOptions = {};

    // Call the afterEvent method
    if (crosshairPlugin.afterEvent) {
      crosshairPlugin.afterEvent(mockChart, args, options);
    }

    // Assert the crosshair coordinates were updated correctly
    expect(mockChart.$crosshair?.x).toBe(100);
    expect(mockChart.$crosshair?.y).toBe(200);
  });
});
