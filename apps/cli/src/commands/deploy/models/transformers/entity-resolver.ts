import type { Relationship } from '@buster/server-shared';
import type { DbtEntity, DbtModel, DbtSemanticModel } from '../dbt-schemas';

/**
 * Entity to Relationship Resolver
 *
 * Transforms dbt semantic layer entities into Buster relationships by inferring
 * target models and primary keys. This is complex due to the need to resolve
 * entity names to actual models using naming conventions and heuristics.
 */

/**
 * Transform dbt entities to Buster relationships
 *
 * Logic:
 * - Primary entities are skipped (they represent the model itself)
 * - Foreign entities → many-to-one relationships
 * - Unique entities → one-to-one relationships
 * - Natural entities → treated as foreign (many-to-one)
 *
 * @param entities - Array of dbt entities
 * @param currentModelName - Name of the current model (for relationship context)
 * @param allModels - All dbt models available for resolution
 * @param allSemanticModels - All semantic models for cross-referencing
 * @returns Array of Buster relationships
 *
 * @example
 * ```typescript
 * const entities = [
 *   { name: "transaction", type: "primary", expr: "transaction_id" },
 *   { name: "customer", type: "foreign", expr: "customer_id" }
 * ];
 *
 * const relationships = transformEntitiesToRelationships(
 *   entities,
 *   "transactions",
 *   allModels,
 *   allSemanticModels
 * );
 * // [
 * //   {
 * //     name: "customer_rel",
 * //     source_col: "customer_id",
 * //     ref_col: "customers.customer_id",
 * //     type: "many_to_one"
 * //   }
 * // ]
 * ```
 */
export function transformEntitiesToRelationships(
  entities: DbtEntity[],
  currentModelName: string,
  allModels: DbtModel[],
  allSemanticModels: DbtSemanticModel[]
): Relationship[] {
  const relationships: Relationship[] = [];

  for (const entity of entities) {
    // Skip primary entities - they represent the model itself, not a relationship
    if (entity.type === 'primary') {
      continue;
    }

    try {
      const relationship = transformEntityToRelationship(
        entity,
        currentModelName,
        allModels,
        allSemanticModels
      );
      relationships.push(relationship);
    } catch (error) {
      // Log warning but don't fail - we'll skip unresolvable entities
      console.warn(
        `Warning: Could not resolve entity '${entity.name}' to relationship: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return relationships;
}

/**
 * Transform a single entity to a Buster relationship
 *
 * @param entity - The dbt entity
 * @param currentModelName - Name of current model
 * @param allModels - All available dbt models
 * @param allSemanticModels - All available semantic models
 * @returns Buster relationship
 * @throws Error if target model or primary key cannot be resolved
 */
function transformEntityToRelationship(
  entity: DbtEntity,
  currentModelName: string,
  allModels: DbtModel[],
  allSemanticModels: DbtSemanticModel[]
): Relationship {
  // Find the target model
  const targetModel = findModelByEntityName(entity.name, allModels, allSemanticModels);
  if (!targetModel) {
    throw new Error(`Cannot find target model for entity '${entity.name}'`);
  }

  // Find the primary key of the target model
  const targetPrimaryKey = findPrimaryKey(targetModel, allSemanticModels);

  // Determine relationship type based on entity type
  let relationType: string;
  if (entity.type === 'foreign') {
    relationType = 'many_to_one';
  } else if (entity.type === 'unique') {
    relationType = 'one_to_one';
  } else {
    // Natural key - treat as foreign (many-to-one)
    relationType = 'many_to_one';
  }

  return {
    name: `${entity.name}_rel`,
    source_col: entity.expr || entity.name,
    ref_col: `${targetModel.name}.${targetPrimaryKey}`,
    type: relationType,
    cardinality: 'optional', // Default to optional - would need constraint analysis to determine required
    description: `Relationship to ${targetModel.name}`,
  };
}

/**
 * Find a model by entity name using naming conventions and heuristics
 *
 * Tries multiple strategies:
 * 1. Exact match
 * 2. Pluralized version (entity → entitys, entity → entities)
 * 3. Common prefixes (dim_, fact_, stg_)
 * 4. Check semantic models for matching entity
 *
 * @param entityName - Name of the entity to find
 * @param models - All available models
 * @param semanticModels - All available semantic models
 * @returns The matching model or null
 */
export function findModelByEntityName(
  entityName: string,
  models: DbtModel[],
  semanticModels: DbtSemanticModel[]
): DbtModel | null {
  const entityLower = entityName.toLowerCase();

  // Strategy 1: Exact match
  let model = models.find((m) => m.name.toLowerCase() === entityLower);
  if (model) return model;

  // Strategy 2: Pluralized versions
  // Simple pluralization: add 's'
  model = models.find((m) => m.name.toLowerCase() === `${entityLower}s`);
  if (model) return model;

  // Handle 'y' → 'ies' (e.g., category → categories)
  if (entityLower.endsWith('y')) {
    const pluralIes = entityLower.slice(0, -1) + 'ies';
    model = models.find((m) => m.name.toLowerCase() === pluralIes);
    if (model) return model;
  }

  // Strategy 3: Common prefixes
  const prefixes = ['dim_', 'fact_', 'stg_', 'staging_', 'fct_'];
  for (const prefix of prefixes) {
    // Try prefix + entity
    model = models.find((m) => m.name.toLowerCase() === `${prefix}${entityLower}`);
    if (model) return model;

    // Try prefix + entity + s
    model = models.find((m) => m.name.toLowerCase() === `${prefix}${entityLower}s`);
    if (model) return model;
  }

  // Strategy 4: Check semantic models for this entity as primary
  const semanticModel = semanticModels.find((sm) =>
    sm.entities.some((e) => e.name.toLowerCase() === entityLower && e.type === 'primary')
  );

  if (semanticModel) {
    // Extract model name from ref() function
    const modelName = extractModelNameFromRef(semanticModel.model);
    model = models.find((m) => m.name === modelName);
    if (model) return model;
  }

  return null;
}

/**
 * Find the primary key column of a model
 *
 * Strategies:
 * 1. Check for primary entity in semantic model
 * 2. Check for columns with 'unique' and 'not_null' tests
 * 3. Check for primary_key constraint
 * 4. Use common naming patterns (id, {model}_id, {model_without_prefix}_id)
 *
 * @param model - The dbt model
 * @param semanticModels - All semantic models for cross-reference
 * @returns Primary key column name
 * @throws Error if primary key cannot be determined
 */
export function findPrimaryKey(model: DbtModel, semanticModels: DbtSemanticModel[]): string {
  // Strategy 1: Check semantic model for primary entity
  const semanticModel = semanticModels.find((sm) => {
    const modelName = extractModelNameFromRef(sm.model);
    return modelName === model.name;
  });

  if (semanticModel) {
    const primaryEntity = semanticModel.entities.find((e) => e.type === 'primary');
    if (primaryEntity && primaryEntity.expr) {
      return primaryEntity.expr;
    }
  }

  // Strategy 2: Check for column with unique + not_null tests
  if (model.columns) {
    for (const column of model.columns) {
      if (!column.data_tests) continue;

      const hasUnique = column.data_tests.some((test) => test === 'unique');
      const hasNotNull = column.data_tests.some((test) => test === 'not_null');

      if (hasUnique && hasNotNull) {
        return column.name;
      }
    }

    // Strategy 3: Check for primary_key constraint
    for (const column of model.columns) {
      if (!column.constraints) continue;

      const hasPrimaryKey = column.constraints.some((c) => c.type === 'primary_key');
      if (hasPrimaryKey) {
        return column.name;
      }
    }
  }

  // Strategy 4: Common naming patterns
  const commonPatterns = [
    'id',
    `${model.name}_id`,
    `${model.name.toLowerCase()}_id`,
    // Try without common prefixes
    `${model.name.replace(/^(dim_|fact_|stg_|staging_|fct_)/, '')}_id`,
  ];

  for (const pattern of commonPatterns) {
    const column = model.columns?.find((c) => c.name.toLowerCase() === pattern.toLowerCase());
    if (column) {
      return column.name;
    }
  }

  // Fallback: return 'id' if we can't determine
  // This is better than failing completely
  console.warn(`Could not determine primary key for model '${model.name}', defaulting to 'id'`);
  return 'id';
}

/**
 * Extract model name from dbt ref() function
 *
 * Parses strings like:
 * - "ref('model_name')" → "model_name"
 * - "ref(\"model_name\")" → "model_name"
 * - "{{ ref('model_name') }}" → "model_name"
 *
 * @param refString - The ref string to parse
 * @returns Extracted model name
 */
export function extractModelNameFromRef(refString: string): string {
  // Remove any surrounding {{ }} (Jinja templating)
  const cleaned = refString
    .trim()
    .replace(/^\{\{\s*/, '')
    .replace(/\s*\}\}$/, '');

  // Match ref('...') or ref("...")
  const match = cleaned.match(/ref\s*\(\s*['"]([^'"]+)['"]\s*\)/);

  if (match?.[1]) {
    return match[1];
  }

  // Fallback: return original if we can't parse
  // This handles cases where model is just a plain string
  return cleaned;
}

/**
 * Validate that a relationship can be resolved
 *
 * Useful for pre-validation before transformation
 *
 * @param entity - The entity to validate
 * @param models - Available models
 * @param semanticModels - Available semantic models
 * @returns Validation result with errors
 */
export function validateEntityResolution(
  entity: DbtEntity,
  models: DbtModel[],
  semanticModels: DbtSemanticModel[]
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Skip primary entities
  if (entity.type === 'primary') {
    return { valid: true, errors: [] };
  }

  // Check if we can find target model
  const targetModel = findModelByEntityName(entity.name, models, semanticModels);
  if (!targetModel) {
    errors.push(`Cannot find target model for entity '${entity.name}'`);
    return { valid: false, errors };
  }

  // Check if we can find primary key
  try {
    findPrimaryKey(targetModel, semanticModels);
  } catch {
    errors.push(`Cannot determine primary key for target model '${targetModel.name}'`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
