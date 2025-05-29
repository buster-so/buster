import { describe, it, expect } from 'vitest';
import { validateMetricYaml } from './validateMetricYaml';
import * as yaml from 'js-yaml';

// Create a minimal mock for monaco
const mockMonaco = {
  MarkerSeverity: {
    Error: 8, // These values match monaco-editor's real values
    Warning: 4,
    Info: 2,
    Hint: 1
  }
};

describe('validateMetricYaml', () => {
  it('should validate a correctly formatted YAML', () => {
    // Arrange
    const validYaml = `Person: "John Doe"
Place: "Wonderland"
Age: 30
Siblings:
  Jane: 25
  Jim: 28`;

    // Act
    const result = validateMetricYaml(validYaml, mockMonaco as any);

    // Assert
    expect(result).toEqual([]);
  });

  it('should detect missing required keys', () => {
    // Arrange
    const invalidYaml = `Person: "John Doe"
Place: "Wonderland"
Age: 30
`; // Missing Siblings

    // Act
    const result = validateMetricYaml(invalidYaml, mockMonaco as any);

    // Assert
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.some(
        (marker) =>
          marker.message.includes('Missing required key "Siblings"') &&
          marker.severity === mockMonaco.MarkerSeverity.Error
      )
    ).toBe(true);
  });

  it('should detect invalid types for fields', () => {
    // Arrange
    const invalidYaml = `Person: "John Doe"
Place: "Wonderland"
Age: "thirty" # Should be a number
Siblings:
  Jane: 25
  Jim: 28`;

    // Act
    const result = validateMetricYaml(invalidYaml, mockMonaco as any);

    // Assert
    expect(result.length).toBeGreaterThan(0);
    const ageErrorMarker = result.find((marker) =>
      marker.message.includes('The "Age" field must be a number')
    );
    expect(ageErrorMarker).toBeDefined();
    expect(ageErrorMarker?.severity).toBe(mockMonaco.MarkerSeverity.Error);
  });
});
