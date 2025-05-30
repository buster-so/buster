# @buster/stored-values

Production-ready vector similarity search package for stored column values using OpenAI embeddings and pgvector.

## Overview

This package provides functionality to search for stored column values using semantic similarity. It uses OpenAI's text-embedding-3-small model to generate embeddings and pgvector's halfvec type with HNSW indexes for efficient similarity search.

## Features

- ✅ **Production Ready**: Full Zod validation, parameterized queries, comprehensive error handling
- 🔍 **Semantic Search**: Using OpenAI's text-embedding-3-small embeddings (1536 dimensions)
- 🏢 **Multi-tenant**: Schema-specific tables for data isolation
- 🎛️ **Advanced Filtering**: Filter by database, schema, table, and column
- ⚡ **Parallel Search**: Search across multiple targets concurrently
- 🎯 **Similarity Thresholds**: Filter results by minimum similarity score
- 🔄 **Automatic Retries**: Built-in retry logic for embedding generation
- 📊 **Health Checks**: Verify database connectivity and table existence
- 🛡️ **Type Safe**: Full TypeScript support with runtime validation

## Installation

```bash
bun add @buster/stored-values
```

## Quick Start

```typescript
import { generateEmbedding, searchValuesByEmbedding } from '@buster/stored-values';

// Generate embedding for search query
const embedding = await generateEmbedding(['user email']);

// Search for similar values with options
const results = await searchValuesByEmbedding(
  'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', // data source UUID
  embedding,
  { limit: 10, similarityThreshold: 0.8 }
);
```

## API Reference

### Core Search Functions

#### `searchValuesByEmbedding(dataSourceId, queryEmbedding, options?)`

Basic semantic similarity search.

```typescript
const results = await searchValuesByEmbedding(
  'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
  embedding,
  {
    limit: 20,                    // Max results (1-1000, default: 10)
    similarityThreshold: 0.7      // Min similarity score (0-1, optional)
  }
);
```

#### `searchValuesByEmbeddingWithFilters(dataSourceId, queryEmbedding, options?, ...filters)`

Search with database/table/column filters.

```typescript
const results = await searchValuesByEmbeddingWithFilters(
  'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
  embedding,
  { limit: 10, similarityThreshold: 0.8 },
  'production',  // database name filter
  'public',      // schema name filter  
  'users',       // table name filter
  'email'        // column name filter
);
```

#### `searchValuesAcrossTargets(dataSourceId, queryEmbedding, targets, limitPerTarget?, options?)`

Parallel search across multiple specific targets.

```typescript
const targets = [
  { database_name: 'prod', schema_name: 'public', table_name: 'users', column_name: 'email' },
  { database_name: 'prod', schema_name: 'public', table_name: 'products', column_name: 'name' }
];

const results = await searchValuesAcrossTargets(
  'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
  embedding,
  targets,
  5,  // limit per target
  { similarityThreshold: 0.8 }
);
```

### Utility Functions

#### `generateEmbedding(searchTerms, options?)`

Generate embeddings with automatic retries.

```typescript
const embedding = await generateEmbedding(
  ['user', 'email', 'address'],
  {
    maxRetries: 5,                    // Retry attempts (0-10, default: 3)
    abortSignal: controller.signal    // Cancellation support
  }
);
```

#### `healthCheck(dataSourceId)`

Verify database connectivity and table existence.

```typescript
const isHealthy = await healthCheck('cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
// Returns: boolean
```

#### `extractSearchableColumnsFromYaml(ymlContent)`

Parse YAML dataset content to find searchable text columns.

```typescript
const yamlString = JSON.stringify({
  database: 'production',
  tables: [{
    name: 'users',
    schema: 'public', 
    columns: [
      { name: 'email', type: 'varchar(255)' },
      { name: 'bio', type: 'text' }
    ]
  }]
});

const targets = extractSearchableColumnsFromYaml(yamlString);
// Returns: SearchTarget[]
```

## Types

```typescript
interface StoredValueResult {
  id: string;
  value: string;
  database_name: string;
  column_name: string;
  table_name: string;
  schema_name: string;
  synced_at: Date | null;
}

interface SearchTarget {
  database_name: string;
  schema_name: string;
  table_name: string;
  column_name: string;
}

interface SearchOptions {
  limit?: number;              // 1-1000, default: 10
  similarityThreshold?: number; // 0-1, optional
}

interface EmbeddingOptions {
  maxRetries?: number;         // 0-10, default: 3
  abortSignal?: AbortSignal;   // Optional cancellation
}
```

## Error Handling

All functions throw `StoredValuesError` with detailed error messages:

```typescript
import { StoredValuesError } from '@buster/stored-values';

try {
  const results = await searchValuesByEmbedding(dataSourceId, embedding);
} catch (error) {
  if (error instanceof StoredValuesError) {
    console.error('Search failed:', error.message);
    console.error('Caused by:', error.cause);
  }
}
```

## Validation

All inputs are validated using Zod schemas:

```typescript
import { UuidSchema, EmbeddingSchema, SearchOptionsSchema } from '@buster/stored-values';

// Validate individual inputs
const validUuid = UuidSchema.parse('cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
const validEmbedding = EmbeddingSchema.parse(embedding); // Must be 1536 dimensions
const validOptions = SearchOptionsSchema.parse({ limit: 50 });
```

## Database Schema

The package expects schema-specific tables:

```sql
CREATE TABLE "ds_{data_source_id}"."searchable_column_values" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL,
  database_name text NOT NULL,
  column_name text NOT NULL,
  table_name text NOT NULL,
  schema_name text NOT NULL,
  embedding halfvec(1536),
  synced_at timestamp with time zone DEFAULT now()
);

-- HNSW index for efficient similarity search
CREATE INDEX idx_embedding_hnsw_{schema_name} 
ON "ds_{data_source_id}"."searchable_column_values"
USING hnsw (embedding halfvec_cosine_ops);
```

## Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host:port/db    # Required
OPENAI_API_KEY=sk-...                              # Required
```

## Testing

```bash
# Unit tests (no external dependencies)
bun test src/__tests__/schemas.unit.test.ts
bun test src/__tests__/utils.unit.test.ts
bun test src/__tests__/search.unit.test.ts

# Integration tests (requires DATABASE_URL and OPENAI_API_KEY)
bun test src/__tests__/search.integration.test.ts
```

## Performance Notes

- **Embedding Dimensions**: Strictly enforced at 1536 (text-embedding-3-small)
- **Query Limits**: Maximum 1000 results per query, 100 targets per parallel search
- **Parameterized Queries**: All SQL uses parameterized queries for security
- **Connection Pooling**: Uses postgres.js connection pooling
- **Parallel Execution**: Multiple targets searched concurrently

## Migration from Rust

This TypeScript package implements the same functionality as `api/libs/stored_values` in Rust:

| Rust Function | TypeScript Function |
|---------------|-------------------|
| `search_values_by_embedding` | `searchValuesByEmbedding` |
| `search_values_by_embedding_with_filters` | `searchValuesByEmbeddingWithFilters` |
| `search_values_across_targets` | `searchValuesAcrossTargets` |
| `extract_searchable_columns_from_yaml` | `extractSearchableColumnsFromYaml` |

## Security Features

- ✅ **SQL Injection Protection**: All queries use parameterized statements
- ✅ **Input Validation**: Comprehensive Zod schema validation
- ✅ **UUID Validation**: Strict UUID format enforcement
- ✅ **Dimension Validation**: Embedding arrays must be exactly 1536 elements
- ✅ **Rate Limiting Support**: Built-in retry logic with exponential backoff
- ✅ **Type Safety**: Full TypeScript coverage with runtime validation