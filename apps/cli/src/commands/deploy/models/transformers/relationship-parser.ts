import type { Relationship } from '@buster/server-shared';
import type { DbtModel, DbtTest } from '../dbt-schemas';
import { extractModelNameFromRef } from './entity-resolver';

/**
 * Relationship Test Parser
 *
 * Extracts relationships from dbt model column tests (the `relationships` test type)
 * and transforms them into Buster relationships.
 */

/**
 * Extract relationships from a dbt model based on relationship tests
 *
 * Scans all columns for `relationships` tests and converts them to
 * Buster relationship objects.
 *
 * @param model - The dbt model to extract relationships from
 * @returns Array of Buster relationships
 *
 * @example
 * ```typescript
 * const model = {
 *   name: "orders",
 *   columns: [
 *     {
 *       name: "customer_id",
 *       data_tests: [
 *         {
 *           relationships: {
 *             to: "ref('customers')",
 *             field: "customer_id"
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * };
 *
 * const relationships = extractRelationshipsFromModel(model);
 * // [
 * //   {
 * //     name: "customers_rel",
 * //     source_col: "customer_id",
 * //     ref_col: "customers.customer_id",
 * //     type: "many_to_one",
 * //     cardinality: "optional"
 * //   }
 * // ]
 * ```
 */
export function extractRelationshipsFromModel(model: DbtModel | undefined): Relationship[] {
  if (!model || !model.columns) {
    return [];
  }

  const relationships: Relationship[] = [];

  for (const column of model.columns) {
    if (!column.data_tests || column.data_tests.length === 0) {
      continue;
    }

    // Process each test to find relationship tests
    for (const test of column.data_tests) {
      const relationship = extractRelationshipFromTest(test, column.name, model.name);
      if (relationship) {
        relationships.push(relationship);
      }
    }
  }

  return relationships;
}

/**
 * Extract a relationship from a single test definition
 *
 * Handles both formats:
 * - Object with relationships property: { relationships: { to: "...", field: "..." } }
 * - String test names are ignored (only relationships tests are relevant)
 *
 * @param test - The test definition
 * @param columnName - Name of the column with this test
 * @param modelName - Name of the current model
 * @returns Buster relationship or null if not a relationship test
 */
function extractRelationshipFromTest(
  test: DbtTest,
  columnName: string,
  modelName: string
): Relationship | null {
  // Skip string tests
  if (typeof test === 'string') {
    return null;
  }

  // Check if this is a relationships test
  if (!('relationships' in test) || !test.relationships) {
    return null;
  }

  const relTest = test.relationships;

  // Validate required fields
  if (!relTest.to || !relTest.field) {
    console.warn(
      `Invalid relationship test on ${modelName}.${columnName}: missing 'to' or 'field'`
    );
    return null;
  }

  // Extract target model name from ref() function
  const targetModel = extractModelNameFromRef(relTest.to);

  // Build relationship
  return {
    name: `${targetModel}_rel`,
    source_col: columnName,
    ref_col: `${targetModel}.${relTest.field}`,
    type: 'many_to_one', // Default assumption for foreign keys
    cardinality: 'optional', // Default - would need constraint analysis for 'required'
    description: `Foreign key relationship to ${targetModel}`,
  };
}

/**
 * Merge relationships from multiple sources, removing duplicates
 *
 * Deduplication logic:
 * - Same source_col and ref_col → keep first occurrence
 * - Prefer relationships with more complete metadata
 *
 * @param relationshipsArrays - Multiple arrays of relationships to merge
 * @returns Deduplicated array of relationships
 */
export function mergeRelationships(...relationshipsArrays: Relationship[][]): Relationship[] {
  const allRelationships = relationshipsArrays.flat();
  const seen = new Set<string>();
  const merged: Relationship[] = [];

  for (const rel of allRelationships) {
    // Create unique key from source and target
    const key = `${rel.source_col}→${rel.ref_col}`;

    if (!seen.has(key)) {
      seen.add(key);
      merged.push(rel);
    }
  }

  return merged;
}

/**
 * Validate a relationship extracted from a test
 *
 * @param relationship - The relationship to validate
 * @returns Validation result with errors
 */
export function validateRelationship(relationship: Relationship): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!relationship.name || relationship.name.trim().length === 0) {
    errors.push('Relationship must have a name');
  }

  if (!relationship.source_col || relationship.source_col.trim().length === 0) {
    errors.push('Relationship must have a source_col');
  }

  if (!relationship.ref_col || relationship.ref_col.trim().length === 0) {
    errors.push('Relationship must have a ref_col');
  }

  // Validate ref_col format (should be "model.column")
  if (relationship.ref_col && !relationship.ref_col.includes('.')) {
    errors.push(`ref_col should be in format 'model.column', got '${relationship.ref_col}'`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract all unique relationship target models from relationships
 *
 * Useful for understanding model dependencies
 *
 * @param relationships - Array of relationships
 * @returns Array of unique target model names
 */
export function getRelationshipTargets(relationships: Relationship[]): string[] {
  const targets = new Set<string>();

  for (const rel of relationships) {
    // Extract model name from ref_col (format: "model.column")
    const [modelName] = rel.ref_col.split('.');
    if (modelName) {
      targets.add(modelName);
    }
  }

  return Array.from(targets);
}
