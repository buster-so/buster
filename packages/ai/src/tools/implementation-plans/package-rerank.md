# Rerank Package Implementation Plan

## Overview

Create a simple reranking service package that uses Cohere's rerank API to semantically reorder search results based on relevance to a query.

## Package Structure

```
packages/rerank/
├── package.json
├── src/
│   ├── index.ts
│   ├── rerank.ts
│   └── __tests__/
│       ├── rerank.unit.test.ts
│       └── rerank.integration.test.ts
└── tsconfig.json
```

## Dependencies

- `axios` - HTTP client for API requests
- `zod` - Input validation schemas

## Implementation

### Core Function

```typescript
export interface RerankResult {
  index: number;
  relevance_score: number;
}

export async function rerankResults(
  query: string, 
  documents: string[]
): Promise<RerankResult[]> {
  try {
    if (!query || documents.length === 0) {
      return documents.map((_, index) => ({ index, relevance_score: 1.0 }));
    }

    const response = await axios.post('https://api.cohere.ai/v1/rerank', {
      query,
      documents,
      top_k: Math.min(10, documents.length)
    }, {
      headers: { 
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Rerank failed:', error);
    // Fallback to original order with equal scores
    return documents.map((_, index) => ({ index, relevance_score: 1.0 }));
  }
}
```

## Test Strategy

### Unit Tests (`rerank.unit.test.ts`)
- Input validation (empty query, empty documents)
- API request formatting and headers
- Error handling with fallback behavior
- Rate limiting and timeout scenarios
- Invalid API key handling

### Integration Tests (`rerank.integration.test.ts`)
- Real Cohere API integration (with API key)
- Relevance score validation
- Large document set handling
- Network failure scenarios
- API response parsing

## AI Agent Implementation Time

**Estimated Time**: 2 minutes
**Complexity**: Very Low

## Usage Pattern

```typescript
import { rerankResults } from '@rerank';

const results = await rerankResults(
  'financial data analysis',
  ['sales_table', 'user_profiles', 'revenue_metrics']
);
// Returns ranked by relevance to query
```