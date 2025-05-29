import { describe, it, expect } from 'vitest';
import { parsePathnameSegments } from './parsePathnameSegments';

describe('parsePathnameSegments', () => {
  it('should parse chat with reasoning pathname correctly', () => {
    const pathname =
      '/app/chats/c2adc995-82b9-45a6-8dff-1cf897665fb0/reasoning/6cd53c00-0b5e-44fc-9a22-c50c00860610';
    const result = parsePathnameSegments(pathname);

    expect(result).toEqual({
      chatId: 'c2adc995-82b9-45a6-8dff-1cf897665fb0',
      messageId: '6cd53c00-0b5e-44fc-9a22-c50c00860610'
    });
  });

  it('should parse chat with metric pathname correctly', () => {
    const pathname = '/app/chats/c2adc995-82b9-45a6-8dff-1cf897665fb0/metrics/1234567890';
    const result = parsePathnameSegments(pathname);

    expect(result).toEqual({
      chatId: 'c2adc995-82b9-45a6-8dff-1cf897665fb0',
      metricId: '1234567890'
    });
  });

  it('should parse dashboard pathname correctly', () => {
    const pathname = '/app/dashboards/c2adc995-82b9-45a6-8dff-1cf897665fb0';
    const result = parsePathnameSegments(pathname);

    expect(result).toEqual({
      dashboardId: 'c2adc995-82b9-45a6-8dff-1cf897665fb0'
    });
  });

  it('should parse dataset pathname correctly', () => {
    const pathname = '/app/datasets/c2adc995-82b9-45a6-8dff-1cf897665fb0';
    const result = parsePathnameSegments(pathname);

    expect(result).toEqual({
      datasetId: 'c2adc995-82b9-45a6-8dff-1cf897665fb0'
    });
  });

  it('should handle empty pathname', () => {
    const pathname = '';
    const result = parsePathnameSegments(pathname);

    expect(result).toEqual({});
  });

  it('should handle root pathname', () => {
    const pathname = '/';
    const result = parsePathnameSegments(pathname);

    expect(result).toEqual({});
  });

  it('should handle pathname with trailing slash', () => {
    const pathname = '/app/chats/c2adc995-82b9-45a6-8dff-1cf897665fb0/';
    const result = parsePathnameSegments(pathname);

    expect(result).toEqual({
      chatId: 'c2adc995-82b9-45a6-8dff-1cf897665fb0'
    });
  });

  it('should parse collection pathname correctly', () => {
    const pathname = '/app/collections/c2adc995-82b9-45a6-8dff-1cf897665fb0';
    const result = parsePathnameSegments(pathname);

    expect(result).toEqual({
      collectionId: 'c2adc995-82b9-45a6-8dff-1cf897665fb0'
    });
  });
});
