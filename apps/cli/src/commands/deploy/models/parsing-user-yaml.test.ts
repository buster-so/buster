import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseModelFile } from './parsing';

/**
 * Test with the EXACT YAML structure provided by the user
 * This verifies end-to-end parsing with real-world YAML including:
 * - Block scalar descriptions (|)
 * - Top-level options field with dash array format
 * - Top-level searchable field
 * - Semantic model with categorical type
 */
describe('parsing - user YAML exact structure', () => {
  let testDir: string;

  beforeEach(async () => {
    const testId = Math.random().toString(36).substring(7);
    testDir = join(tmpdir(), `buster-cli-test-${testId}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should parse exact user YAML structure with block scalars and top-level fields', async () => {
    const testFile = join(testDir, 'user-product.yml');

    // This is the EXACT structure from the user's file
    const yamlContent = `version: 2

models:
  - name: product
    description: |
      Product catalog dimension representing Adventure Works' full inventory.
    columns:
      - name: color
        description: |
          What it is: Product color attribute for bikes, frames, and certain accessories.
          How to use it: Filter and segment by color for inventory and sales analysis; used in product recommendations.
          Data characteristics: 49% null (components without color); 9 distinct colors when populated; Black most common (18%), followed by Silver (9%), Red (8%).
          Patterns & Insights: Bikes and frames have color; components and certain accessories do not. Null by design, not missing data.
          Watch out for: High null rate is expected; filter to non-null for color-based analysis. Multiple color options exist for most bike models.
        options:
          - Black
          - Silver
          - Red
          - Blue
          - Green
          - Yellow
          - Purple
          - Orange
          - Brown
        searchable: true

semantic_models:
  - name: product_semantic
    model: ref('product')
    description: |
      Product semantic layer for catalog analysis.
    entities: []
    dimensions:
      - name: color
        type: categorical
        description: |
          Product color attribute; 49% null (components without color, by design).
          Black most common (18%), followed by Silver (9%), Red (8%).
    measures: []
`;

    await writeFile(testFile, yamlContent);

    const result = await parseModelFile(testFile);

    // Should parse successfully
    expect(result.models).toHaveLength(1);
    expect(result.errors).toHaveLength(0);

    const model = result.models[0];
    expect(model?.name).toBe('product');

    // Should have 1 dimension (color merged from column + semantic)
    expect(model?.dimensions).toHaveLength(1);

    const colorDim = model?.dimensions[0];
    expect(colorDim?.name).toBe('color');

    // ✅ CRITICAL: Should preserve searchable from column (top-level field)
    expect(colorDim?.searchable).toBe(true);

    // ✅ CRITICAL: Should preserve options from column (top-level field with YAML dash format)
    expect(colorDim?.options).toBeDefined();
    expect(colorDim?.options).toEqual([
      'Black',
      'Silver',
      'Red',
      'Blue',
      'Green',
      'Yellow',
      'Purple',
      'Orange',
      'Brown',
    ]);

    // ✅ Should use type from semantic dimension (normalized categorical → string)
    expect(colorDim?.type).toBe('string');

    // ✅ Should use column description (precedence rule)
    expect(colorDim?.description).toContain(
      'Product color attribute for bikes, frames, and certain accessories'
    );

    // ✅ Should NOT appear as a measure
    expect(model?.measures).toHaveLength(0);
  });
});
