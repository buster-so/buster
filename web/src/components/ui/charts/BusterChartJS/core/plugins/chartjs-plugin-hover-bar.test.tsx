import { Chart } from 'chart.js';
import { ChartHoverBarPlugin } from './chartjs-plugin-hover-bar';

describe('ChartHoverBarPlugin', () => {
  it('should draw a hover bar when tooltip is active', () => {
    // Mock chart instance
    const mockCtx = {
      save: jest.fn(),
      fillRect: jest.fn(),
      restore: jest.fn()
    };

    const mockChart = {
      ctx: mockCtx,
      $pluginHoverBarManager: { enabled: true },
      tooltip: {
        getActiveElements: () => [
          {
            index: 1
          }
        ]
      },
      chartArea: {
        top: 0,
        bottom: 100,
        left: 0,
        right: 100
      },
      scales: {
        x: {
          getPixelForValue: (value: number) => value * 10
        },
        y: {
          getPixelForValue: (value: number) => value * 10
        }
      },
      options: {
        indexAxis: 'x'
      }
    } as unknown as Chart;

    // Call the plugin's beforeDraw method
    if (ChartHoverBarPlugin.beforeDraw) {
      ChartHoverBarPlugin.beforeDraw(mockChart, null as any, { isDarkMode: false });

      // Assert that the context methods were called correctly
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalledWith(5, 0, 10, 100);
      expect(mockCtx.restore).toHaveBeenCalled();
    }
  });
});
