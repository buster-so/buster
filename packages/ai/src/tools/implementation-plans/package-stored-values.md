# Stored Values Package Implementation Plan

## Overview

Create a simple stored values search package that uses vector embeddings and cosine similarity to find matching values in the database.

## Package Structure

```
packages/stored-values/
├── package.json
├── src/
│   ├── index.ts
│   ├── search.ts
│   └── __tests__/
│       ├── search.unit.test.ts
│       └── search.integration.test.ts
└── tsconfig.json
```

## Dependencies

- `@ai-sdk/openai` - Embeddings generation
- `@database` - Database connection
- `ai` - AI SDK embed function

## Implementation

### Core Function

```typescript
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { db } from '@database';

export interface StoredValue {
  value: string;
  database_name: string;
  schema_name: string;
  table_name: string;
  column_name: string;
  similarity?: number;
}

export async function searchStoredValues(
  searchTerms: string[]
): Promise<StoredValue[]> {
  try {
    if (searchTerms.length === 0) return [];

    // Generate embedding using AI SDK
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: searchTerms.join(' ')
    });

    // Raw SQL query with cosine similarity
    const query = `
      SELECT 
        value, 
        database_name, 
        schema_name, 
        table_name, 
        column_name,
        1 - (embedding <=> $1::vector) as similarity
      FROM stored_values 
      WHERE 1 - (embedding <=> $1::vector) > 0.7
      ORDER BY similarity DESC
      LIMIT 50
    `;

    const results = await db.execute(query, [embedding]);
    return results.rows as StoredValue[];
    
  } catch (error) {
    console.error('Stored values search failed:', error);
    return [];
  }
}
```

## Test Strategy

### Unit Tests (`search.unit.test.ts`)
- Input validation (empty search terms)
- Embedding generation mocking
- Database query formatting
- Error handling scenarios
- Similarity threshold validation

### Integration Tests (`search.integration.test.ts`)
- Real OpenAI embeddings API integration
- Database vector operations
- Large result set handling
- Performance with various query sizes
- Cosine similarity accuracy validation

## AI Agent Implementation Time

**Estimated Time**: 2 minutes
**Complexity**: Very Low

## Database Schema Requirement

```sql
CREATE TABLE stored_values (
  id SERIAL PRIMARY KEY,
  value TEXT NOT NULL,
  database_name TEXT NOT NULL,
  schema_name TEXT,
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  embedding vector(1536) NOT NULL
);

CREATE INDEX stored_values_embedding_idx ON stored_values 
USING ivfflat (embedding vector_cosine_ops);
```

## Usage Pattern

```typescript
import { searchStoredValues } from '@stored-values';

const values = await searchStoredValues(['john@email.com', 'user data']);
// Returns matching values with similarity scores
```