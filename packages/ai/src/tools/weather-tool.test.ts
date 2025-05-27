import { describe, expect, test } from 'bun:test';
import { weatherTool } from './weather-tool';

describe('Weather Tool Unit Tests', () => {
  test('should have correct configuration', () => {
    expect(weatherTool.id).toBe('get-weather');
    expect(weatherTool.description).toBe('Get current weather for a location');
    expect(weatherTool.inputSchema).toBeDefined();
    expect(weatherTool.outputSchema).toBeDefined();
    expect(weatherTool.execute).toBeDefined();
  });

  test('should validate input schema', () => {
    const validInput = { location: 'New York' };
    const result = weatherTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);

    const invalidInput = { city: 'New York' }; // wrong property name
    const invalidResult = weatherTool.inputSchema.safeParse(invalidInput);
    expect(invalidResult.success).toBe(false);
  });

  test('should validate output schema structure', () => {
    const validOutput = {
      temperature: 20.5,
      feelsLike: 22.0,
      humidity: 65,
      windSpeed: 10.2,
      windGust: 15.5,
      conditions: 'Partly cloudy',
      location: 'London',
    };

    const result = weatherTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should reject invalid output schema', () => {
    const invalidOutput = {
      temperature: '20.5', // should be number
      feelsLike: 22.0,
      humidity: 65,
      windSpeed: 10.2,
      windGust: 15.5,
      conditions: 'Partly cloudy',
      location: 'London',
    };

    const result = weatherTool.outputSchema.safeParse(invalidOutput);
    expect(result.success).toBe(false);
  });
});
