import type { Model } from '@buster/server-shared';
import type { DbtFile, DbtModel, DbtSemanticModel } from './dbt-schemas';
import { transformColumnsToDimensionsAndMeasures } from './transformers/column-transformer';
import { transformDimensionsToFilters } from './transformers/dimension-filter-transformer';
import { mergeDimensions } from './transformers/dimension-merger';
import {
  extractModelNameFromRef,
  transformEntitiesToRelationships,
} from './transformers/entity-resolver';
import { transformMeasuresToMetrics } from './transformers/measure-transformer';
import {
  extractRelationshipsFromModel,
  mergeRelationships,
} from './transformers/relationship-parser';

/**
 * Main DBT to Buster Transformer
 *
 * Orchestrates all transformation functions to convert a complete dbt file
 * (with models and semantic_models) into an array of Buster models.
 */

/**
 * Transform a complete dbt YAML file to Buster models
 *
 * Process flow:
 * 1. Process semantic models first (primary source of truth)
 * 2. For each semantic model:
 *    - Extract base model name
 *    - Find corresponding traditional model
 *    - Transform measures → metrics
 *    - Transform dimensions → filters
 *    - Transform entities → relationships
 *    - Transform model columns → dimensions + measures
 *    - Merge all components
 * 3. Process remaining traditional models without semantic layer (fallback)
 *
 * @param dbtFile - Parsed and validated dbt YAML file
 * @returns Array of Buster models
 *
 * @example
 * ```typescript
 * const dbtFile = {
 *   version: 2,
 *   models: [{ name: "orders", columns: [...] }],
 *   semantic_models: [{
 *     name: "orders_semantic",
 *     model: "ref('orders')",
 *     entities: [...],
 *     dimensions: [...],
 *     measures: [...]
 *   }]
 * };
 *
 * const busterModels = transformDbtFileToBusterModels(dbtFile);
 * ```
 */
export function transformDbtFileToBusterModels(dbtFile: DbtFile): Model[] {
  const busterModels: Model[] = [];
  const processedModelNames = new Set<string>();

  // Phase 1: Process semantic models (primary source)
  for (const semanticModel of dbtFile.semantic_models) {
    try {
      const model = transformSemanticModelToBusterModel(semanticModel, dbtFile);
      busterModels.push(model);
      processedModelNames.add(model.name);
    } catch (error) {
      console.error(
        `Error transforming semantic model '${semanticModel.name}': ${error instanceof Error ? error.message : String(error)}`
      );
      // Continue processing other models
    }
  }

  // Phase 2: Process remaining traditional models without semantic layer (fallback)
  for (const dbtModel of dbtFile.models) {
    // Skip if already processed via semantic model
    if (processedModelNames.has(dbtModel.name)) {
      continue;
    }

    try {
      const model = transformTraditionalModelToBusterModel(dbtModel, dbtFile);
      busterModels.push(model);
      processedModelNames.add(model.name);
    } catch (error) {
      console.error(
        `Error transforming model '${dbtModel.name}': ${error instanceof Error ? error.message : String(error)}`
      );
      // Continue processing other models
    }
  }

  return busterModels;
}

/**
 * Transform a semantic model (with optional traditional model) to Buster model
 *
 * CUSTOM BUSTER EXTENSIONS:
 *
 * Dimensions are merged with the following precedence:
 * 1. Column-level metadata (description, searchable, options) from dbtModel.columns
 * 2. Semantic-level metadata (type, time_granularity) from semanticModel.dimensions
 * 3. Complex semantic dimensions (with SQL expr) remain separate
 *
 * Measures are filtered to exclude semantic dimensions:
 * - Columns defined as semantic dimensions are NOT included as measures
 * - Only numeric columns NOT in semantic layer become measures
 * - This prevents duplicates where a column is both dimension and measure
 *
 * Relationships are merged with the following precedence:
 * 1. Model-level relationships (dbtModel.relationships) - Custom Buster extension
 * 2. Semantic entities (semanticModel.entities)
 * 3. Column relationship tests (dbtModel.columns[].data_tests)
 *
 * @param semanticModel - The dbt semantic model
 * @param dbtFile - Complete dbt file for cross-references
 * @returns Buster model
 */
function transformSemanticModelToBusterModel(
  semanticModel: DbtSemanticModel,
  dbtFile: DbtFile
): Model {
  // Extract base model name from ref() function
  const baseModelName = extractModelNameFromRef(semanticModel.model);

  // Find corresponding traditional model
  const dbtModel = dbtFile.models.find((m) => m.name === baseModelName);

  // Transform columns to dimensions and measures
  const { dimensions: columnDimensions, measures: columnMeasures } =
    transformColumnsToDimensionsAndMeasures(dbtModel?.columns || []);

  // Merge column dimensions with semantic dimensions
  // This deduplicates and combines metadata from both sources
  const dimensions = mergeDimensions(columnDimensions, semanticModel.dimensions);

  // Filter out measures for columns that are defined as semantic dimensions
  // Only include measures for columns NOT in the semantic layer
  const semanticDimensionNames = new Set(semanticModel.dimensions.map((d) => d.name));
  const measures = columnMeasures.filter((m) => !semanticDimensionNames.has(m.name));

  // Transform semantic measures to metrics
  const metrics = transformMeasuresToMetrics(semanticModel.measures);

  // Transform semantic dimensions to filters
  const filters = transformDimensionsToFilters(semanticModel.dimensions);

  // Extract relationships with precedence:
  // 1. Model-level relationships (custom Buster extension - highest priority)
  const modelRelationships = dbtModel?.relationships || [];

  // 2. Entity-based relationships (semantic layer)
  const entityRelationships = transformEntitiesToRelationships(
    semanticModel.entities,
    baseModelName,
    dbtFile.models,
    dbtFile.semantic_models
  );

  // 3. Test-based relationships (traditional dbt)
  const testRelationships = extractRelationshipsFromModel(dbtModel);

  // Merge with precedence: model-level > entities > tests
  const relationships = mergeRelationships(
    modelRelationships,
    mergeRelationships(entityRelationships, testRelationships)
  );

  // Build Buster model
  const model: Model = {
    name: baseModelName,
    description: semanticModel.description || dbtModel?.description || '',
    dimensions,
    measures,
    metrics,
    filters,
    relationships,
    clarifications: [],
  };

  return model;
}

/**
 * Transform a traditional dbt model (without semantic layer) to Buster model
 *
 * Fallback transformation when no semantic model exists.
 * Only provides dimensions, measures, and relationships.
 * No metrics or filters since those require semantic layer.
 *
 * CUSTOM BUSTER EXTENSIONS:
 * Relationships are merged with the following precedence:
 * 1. Model-level relationships (dbtModel.relationships) - Custom Buster extension
 * 2. Column relationship tests (dbtModel.columns[].data_tests)
 *
 * @param dbtModel - The dbt model
 * @param dbtFile - Complete dbt file for cross-references
 * @returns Buster model
 */
function transformTraditionalModelToBusterModel(dbtModel: DbtModel, dbtFile: DbtFile): Model {
  // Transform columns to dimensions and measures
  const { dimensions, measures } = transformColumnsToDimensionsAndMeasures(dbtModel.columns || []);

  // Extract relationships with precedence:
  // 1. Model-level relationships (custom Buster extension - highest priority)
  const modelRelationships = dbtModel.relationships || [];

  // 2. Test-based relationships (traditional dbt)
  const testRelationships = extractRelationshipsFromModel(dbtModel);

  // Merge with precedence: model-level > tests
  const relationships = mergeRelationships(modelRelationships, testRelationships);

  // Build Buster model (no metrics or filters without semantic layer)
  const model: Model = {
    name: dbtModel.name,
    description: dbtModel.description || '',
    dimensions,
    measures,
    metrics: [],
    filters: [],
    relationships,
    clarifications: [],
  };

  return model;
}

/**
 * Validate a dbt file before transformation
 *
 * Checks for:
 * - At least one model or semantic model
 * - Valid structure
 *
 * @param dbtFile - The dbt file to validate
 * @returns Validation result with errors
 */
export function validateDbtFileForTransformation(dbtFile: DbtFile): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for content
  if (dbtFile.models.length === 0 && dbtFile.semantic_models.length === 0) {
    errors.push('DBT file must contain at least one model or semantic_model');
  }

  // Check for semantic models without corresponding traditional models
  for (const semanticModel of dbtFile.semantic_models) {
    const modelName = extractModelNameFromRef(semanticModel.model);
    const hasTraditionalModel = dbtFile.models.some((m) => m.name === modelName);

    if (!hasTraditionalModel) {
      warnings.push(
        `Semantic model '${semanticModel.name}' references model '${modelName}' which is not defined in the models array. Columns will not be available.`
      );
    }
  }

  // Check for models with measures but no time dimension
  for (const semanticModel of dbtFile.semantic_models) {
    if (semanticModel.measures.length > 0 && !semanticModel.defaults?.agg_time_dimension) {
      warnings.push(
        `Semantic model '${semanticModel.name}' has measures but no agg_time_dimension set in defaults`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get statistics about a dbt file
 *
 * Useful for logging and debugging
 *
 * @param dbtFile - The dbt file
 * @returns Statistics object
 */
export function getDbtFileStatistics(dbtFile: DbtFile): {
  modelCount: number;
  semanticModelCount: number;
  totalColumns: number;
  totalEntities: number;
  totalDimensions: number;
  totalMeasures: number;
} {
  const totalColumns = dbtFile.models.reduce((sum, m) => sum + (m.columns?.length || 0), 0);

  const totalEntities = dbtFile.semantic_models.reduce((sum, sm) => sum + sm.entities.length, 0);

  const totalDimensions = dbtFile.semantic_models.reduce(
    (sum, sm) => sum + sm.dimensions.length,
    0
  );

  const totalMeasures = dbtFile.semantic_models.reduce((sum, sm) => sum + sm.measures.length, 0);

  return {
    modelCount: dbtFile.models.length,
    semanticModelCount: dbtFile.semantic_models.length,
    totalColumns,
    totalEntities,
    totalDimensions,
    totalMeasures,
  };
}
