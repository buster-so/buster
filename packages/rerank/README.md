# @buster/rerank

A TypeScript package for reranking search results using semantic relevance scoring via configurable reranking APIs.

## Installation

```bash
bun add @buster/rerank
```

## Configuration

The package requires the following environment variables:

- `RERANK_API_KEY` - Your reranking API key
- `RERANK_BASE_URL` - The base URL for the reranking API (e.g., `https://api.cohere.ai/v1/rerank`)
- `RERANK_MODEL` - The model to use for reranking (e.g., `rerank-english-v3.0`)

## Usage

### Basic Usage

```typescript
import { rerankResults } from '@buster/rerank';

const query = 'What is the capital of France?';
const documents = [
  'Paris is the capital of France',
  'London is the capital of England',
  'Berlin is the capital of Germany'
];

const results = await rerankResults(query, documents);
// Returns: [{ index: 0, relevance_score: 0.95 }, ...]
```

### Using the Reranker Class

```typescript
import { Reranker } from '@buster/rerank';

const reranker = new Reranker();
const results = await reranker.rerank(query, documents, topN);
```

### Custom Configuration

```typescript
import { Reranker } from '@buster/rerank';

const reranker = new Reranker({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.example.com/rerank',
  model: 'custom-model'
});
```

## API

### `rerankResults(query, documents, topN?, config?)`

Reranks documents based on relevance to a query.

- `query`: The search query string
- `documents`: Array of document strings to rerank
- `topN`: Optional number of top results to return (defaults to 10 or document count)
- `config`: Optional configuration override

Returns: Array of `RerankResult` objects with `index` and `relevance_score`

### Error Handling

The package handles errors gracefully by returning all documents with equal relevance scores (1.0) when:
- The API is unavailable
- Invalid credentials are provided
- Rate limits are exceeded
- Network errors occur

## Development

```bash
# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Type checking
bun typecheck

# Linting
bun lint
bun lint:fix

# Formatting
bun format
bun format:fix
```

## Testing

The package includes comprehensive unit and integration tests. Integration tests require valid API credentials and will be skipped if not available.