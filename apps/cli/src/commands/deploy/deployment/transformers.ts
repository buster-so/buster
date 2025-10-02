import type { deploy } from '@buster/server-shared';

type DeployDoc = deploy.DeployDoc;
type UnifiedDeployRequest = deploy.UnifiedDeployRequest;
type LogsConfig = deploy.LogsConfig;
type LogsWritebackConfig = deploy.LogsWritebackConfig;

import yaml from 'js-yaml';
import { generateDefaultSQL } from '../models/parsing';
import type { DeployColumn, DeployModel, Model } from '../schemas';

/**
 * Pure function to prepare a unified deployment request from models and docs
 */
export function prepareDeploymentRequest(
  models: Model[],
  docs: DeployDoc[] = [],
  deleteAbsentModels = true,
  deleteAbsentDocs = true,
  logsConfig?: LogsConfig
): UnifiedDeployRequest {
  // Transform logs config to logsWriteback format if present
  const logsWriteback: LogsWritebackConfig | undefined = logsConfig
    ? {
        enabled: true,
        dataSource: logsConfig.data_source,
        database: logsConfig.database,
        schema: logsConfig.schema,
        tableName: logsConfig.table_name || 'buster_query_logs',
      }
    : undefined;

  if (logsConfig) {
    console.info('  ✓ Logs writeback configuration found:', {
      database: logsConfig.database,
      schema: logsConfig.schema,
      table_name: logsConfig.table_name || 'buster_query_logs',
    });
  } else {
    console.info('  ℹ No logs writeback configuration found - will remove any existing config');
  }

  return {
    models: models.map(modelToDeployModel),
    docs,
    deleteAbsentModels,
    deleteAbsentDocs,
    logsWriteback,
  };
}

/**
 * Pure function to transform a Model to a DeployModel
 */
export function modelToDeployModel(model: Model): DeployModel {
  const columns = [...dimensionsToColumns(model.dimensions), ...measuresToColumns(model.measures)];

  // Ensure required fields are present
  if (!model.data_source_name) {
    throw new Error(`Model ${model.name} is missing data_source_name`);
  }
  if (!model.schema) {
    throw new Error(`Model ${model.name} is missing schema`);
  }

  return {
    name: model.name,
    data_source_name: model.data_source_name,
    schema: model.schema,
    database: model.database,
    description: model.description || '',
    sql_definition: generateDefaultSQL(model),
    columns,
    yml_file: yaml.dump(model),
    metrics: model.metrics,
    filters: model.filters,
    relationships: model.relationships,
  };
}

/**
 * Pure function to transform dimensions to deploy columns
 */
export function dimensionsToColumns(dimensions: Model['dimensions']): DeployColumn[] {
  return dimensions.map((dimension) => ({
    name: dimension.name,
    description: dimension.description || '',
    semantic_type: 'dimension',
    type: dimension.type,
    searchable: dimension.searchable,
    expr: undefined,
    agg: undefined,
  }));
}

/**
 * Pure function to transform measures to deploy columns
 */
export function measuresToColumns(measures: Model['measures']): DeployColumn[] {
  return measures.map((measure) => ({
    name: measure.name,
    description: measure.description || '',
    semantic_type: 'measure',
    type: measure.type,
    searchable: false,
    expr: undefined,
    agg: undefined,
  }));
}

/**
 * Pure function to create a model-to-file mapping
 */
export function createModelFileMap(
  modelFiles: Array<{ file: string; models: Model[] }>
): Map<string, string> {
  const map = new Map<string, string>();

  for (const { file, models } of modelFiles) {
    for (const model of models) {
      map.set(model.name, file);
    }
  }

  return map;
}

/**
 * Pure function to validate models for deployment
 */
export function validateModelsForDeployment(models: Model[]): {
  valid: Model[];
  invalid: Array<{ model: Model; errors: string[] }>;
} {
  const valid: Model[] = [];
  const invalid: Array<{ model: Model; errors: string[] }> = [];

  for (const model of models) {
    const errors: string[] = [];

    if (!model.name || model.name.trim().length === 0) {
      errors.push('Model name is required');
    }

    if (!model.data_source_name) {
      errors.push('data_source_name is required');
    }

    if (!model.schema) {
      errors.push('schema is required');
    }

    if (model.dimensions.length === 0 && model.measures.length === 0) {
      errors.push('Model must have at least one dimension or measure');
    }

    if (errors.length > 0) {
      invalid.push({ model, errors });
    } else {
      valid.push(model);
    }
  }

  return { valid, invalid };
}

/**
 * Pure function to batch models by data source
 */
export function batchModelsByDataSource(models: Model[]): Map<string, Model[]> {
  const batches = new Map<string, Model[]>();

  for (const model of models) {
    const key = `${model.data_source_name || 'unknown'}:${model.schema || 'unknown'}`;
    const batch = batches.get(key) || [];
    batch.push(model);
    batches.set(key, batch);
  }

  return batches;
}
