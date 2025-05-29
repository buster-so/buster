import { describe, it, expect } from 'vitest';
import { createChatRecord } from './createChatRecord';
import dayjs from 'dayjs';

describe('createChatRecord', () => {
  // Create test dates based on current time
  const now = dayjs();
  const today = now.format();
  const yesterday = now.subtract(1, 'day').format();
  const threeDaysAgo = now.subtract(3, 'day').format();
  const tenDaysAgo = now.subtract(10, 'day').format();

  // More precise yesterday times for edge case testing
  const yesterdayStart = now.subtract(1, 'day').startOf('day').format();
  const yesterdayMiddle = now.subtract(1, 'day').hour(12).minute(0).second(0).format();
  const yesterdayEnd = now.subtract(1, 'day').endOf('day').format();
  it('should return empty buckets when input array is empty', () => {
    const result = createChatRecord([]);

    expect(result).toEqual({
      TODAY: [],
      YESTERDAY: [],
      LAST_WEEK: [],
      ALL_OTHERS: []
    });
  });
  it('should categorize items into correct buckets', () => {
    const mockData = [
      { id: '1', last_edited: today },
      { id: '2', last_edited: yesterday },
      { id: '3', last_edited: threeDaysAgo },
      { id: '4', last_edited: tenDaysAgo }
    ];

    const result = createChatRecord(mockData);

    // Check TODAY bucket
    expect(result.TODAY.length).toBe(1);
    expect(result.TODAY[0].id).toBe('1');

    // Check YESTERDAY bucket
    expect(result.YESTERDAY.length).toBe(1);
    expect(result.YESTERDAY[0].id).toBe('2');

    // Check LAST_WEEK bucket
    expect(result.LAST_WEEK.length).toBe(1);
    expect(result.LAST_WEEK[0].id).toBe('3');

    // Check ALL_OTHERS bucket
    expect(result.ALL_OTHERS.length).toBe(1);
    expect(result.ALL_OTHERS[0].id).toBe('4');
  });
  it('should place all items in ALL_OTHERS when all are older than a week', () => {
    const mockData = [
      { id: '1', last_edited: tenDaysAgo },
      { id: '2', last_edited: now.subtract(15, 'day').format() },
      { id: '3', last_edited: now.subtract(30, 'day').format() }
    ];

    const result = createChatRecord(mockData);

    expect(result.TODAY).toHaveLength(0);
    expect(result.YESTERDAY).toHaveLength(0);
    expect(result.LAST_WEEK).toHaveLength(0);
    expect(result.ALL_OTHERS).toHaveLength(3);
    expect(result.ALL_OTHERS.map((item) => item.id)).toEqual(['1', '2', '3']);
  });
  it('should handle items with extended properties', () => {
    // Create an item with additional properties beyond the required id and last_edited
    const extendedItem = {
      id: '1',
      last_edited: today,
      name: 'Test Item',
      created_by: 'user-123',
      updated_at: '2025-04-22T20:40:31.672893+00:00',
      extra_field: 'some value'
    };

    const result = createChatRecord([extendedItem]);

    // Verify the item is placed in TODAY bucket and preserves all properties
    expect(result.TODAY).toHaveLength(1);
    expect(result.TODAY[0]).toEqual(extendedItem);
    expect(result.TODAY[0].name).toBe('Test Item');
    expect(result.TODAY[0].extra_field).toBe('some value');
  });
  it('should place multiple items from yesterday in the YESTERDAY bucket', () => {
    const mockData = [
      { id: 'y1', last_edited: yesterday },
      { id: 'y2', last_edited: yesterdayStart },
      { id: 'y3', last_edited: yesterdayMiddle },
      { id: 'y4', last_edited: yesterdayEnd }
    ];

    const result = createChatRecord(mockData);

    expect(result.TODAY).toHaveLength(0);
    expect(result.YESTERDAY).toHaveLength(4);
    expect(result.LAST_WEEK).toHaveLength(0);
    expect(result.ALL_OTHERS).toHaveLength(0);

    // Verify all IDs are in the YESTERDAY bucket
    const yesterdayIds = result.YESTERDAY.map((item) => item.id);
    expect(yesterdayIds).toContain('y1');
    expect(yesterdayIds).toContain('y2');
    expect(yesterdayIds).toContain('y3');
    expect(yesterdayIds).toContain('y4');
  });
  it('should handle boundary cases for yesterday time', () => {
    // Create dates right at the boundary of yesterday/today
    const almostToday = now.startOf('day').subtract(1, 'millisecond').format();
    const barelyToday = now.startOf('day').format();

    const mockData = [
      { id: 'still-yesterday', last_edited: almostToday },
      { id: 'barely-today', last_edited: barelyToday }
    ];

    const result = createChatRecord(mockData);

    expect(result.YESTERDAY).toHaveLength(1);
    expect(result.YESTERDAY[0].id).toBe('still-yesterday');

    expect(result.TODAY).toHaveLength(1);
    expect(result.TODAY[0].id).toBe('barely-today');
  });
  it('should sort items correctly when mixed with other time periods', () => {
    // Create a mix of items with some yesterday dates mixed in
    const mockData = [
      { id: 'today-1', last_edited: today },
      { id: 'yesterday-1', last_edited: yesterday },
      { id: 'last-week', last_edited: threeDaysAgo },
      { id: 'yesterday-2', last_edited: yesterdayEnd },
      { id: 'old-item', last_edited: tenDaysAgo },
      { id: 'yesterday-3', last_edited: yesterdayStart },
      { id: 'today-2', last_edited: now.format() }
    ];

    const result = createChatRecord(mockData);

    // Verify correct counts in each bucket
    expect(result.TODAY).toHaveLength(2);
    expect(result.YESTERDAY).toHaveLength(3);
    expect(result.LAST_WEEK).toHaveLength(1);
    expect(result.ALL_OTHERS).toHaveLength(1);

    // Verify all yesterday items are in the YESTERDAY bucket
    const yesterdayIds = result.YESTERDAY.map((item) => item.id);
    expect(yesterdayIds).toContain('yesterday-1');
    expect(yesterdayIds).toContain('yesterday-2');
    expect(yesterdayIds).toContain('yesterday-3');
  });
});
