import { _adapters } from 'chart.js';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import './chartjs-plugin-dayjs';

describe('chartjs-plugin-dayjs', () => {
  it('should correctly parse a date string with a specific format', () => {
    const dateString = '2024-03-20';
    const format = 'YYYY-MM-DD';

    // Get the expected timestamp using dayjs directly
    const expectedTimestamp = dayjs(dateString).valueOf();

    // Access the adapter's parse method through the prototype
    const adapter = Object.create(_adapters._date.prototype);
    const result = adapter.parse(dateString, format);

    expect(result).toBe(expectedTimestamp);
  });
});
