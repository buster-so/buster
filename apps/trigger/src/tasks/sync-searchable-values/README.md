# Sync Searchable Values Task

Daily scheduled task that synchronizes searchable column values from data sources to enable autocomplete and value filtering in the Buster UI.

## Overview

This task runs daily at 2 AM UTC and:
1. Identifies data sources with searchable columns
2. Creates sync jobs for columns that need updating
3. Processes each sync job to extract and store distinct values
4. Reports on sync status and any errors

## Architecture

```
┌─────────────────────────────┐
│   Daily Cron (2 AM UTC)     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  sync-searchable-values.ts  │ ◄── Main scheduled task
├─────────────────────────────┤
│ 1. Query data sources       │
│ 2. Create sync jobs         │
│ 3. Queue processing tasks   │
│ 4. Generate report          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│    process-sync-job.ts      │ ◄── Individual job processor
├─────────────────────────────┤
│ 1. Connect to data source   │
│ 2. Query distinct values    │
│ 3. Store in cache           │
│ 4. Update metadata          │
└─────────────────────────────┘
```

## File Structure

- `sync-searchable-values.ts` - Main scheduled task that orchestrates the daily sync
- `process-sync-job.ts` - Processes individual column sync jobs (stub for Ticket 8)
- `types.ts` - Zod schemas and TypeScript types for validation
- `index.ts` - Module exports

## Configuration

### Schedule
- **Cron Pattern**: `0 2 * * *` (Daily at 2 AM UTC)
- **Max Duration**: 3600 seconds (1 hour)
- **Retry Policy**: 3 attempts with exponential backoff

### Processing
- **Batch Size**: 10 columns processed concurrently
- **Job Timeout**: 300 seconds (5 minutes) per column
- **Max Values**: 1000 distinct values per column

## Database Integration

Uses query helpers from `@buster/database`:

### Reading Data
- `getDataSourcesForSync()` - Find data sources with searchable columns
- `getSearchableColumns()` - Get columns configured for value storage

### Managing Jobs
- `batchCreateSyncJobs()` - Create sync job records
- `markSyncJobInProgress()` - Update status when starting
- `markSyncJobCompleted()` - Record successful completion
- `markSyncJobFailed()` - Handle failures

## Types

### SyncJobPayload
Input for processing individual sync jobs:
```typescript
{
  jobId: string;
  dataSourceId: string;
  databaseName: string;
  schemaName: string;
  tableName: string;
  columnName: string;
  columnType?: string;
  maxValues: number;
}
```

### SyncJobResult
Output from sync job processing:
```typescript
{
  jobId: string;
  success: boolean;
  processedCount?: number;
  existingCount?: number;
  newCount?: number;
  duration?: number;
  error?: string;
}
```

### DailySyncReport
Summary of daily execution:
```typescript
{
  executionId: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  totalDataSources: number;
  totalColumns: number;
  successfulSyncs: number;
  failedSyncs: number;
  skippedSyncs: number;
  totalValuesProcessed: number;
  dataSourceSummaries: DataSourceSyncSummary[];
  errors: string[];
}
```

## Usage

### Manual Trigger
```typescript
import { tasks } from '@trigger.dev/sdk';
import type { syncSearchableValues } from './sync-searchable-values';

// Trigger manually (outside of schedule)
const handle = await tasks.trigger<typeof syncSearchableValues>(
  'sync-searchable-values',
  {
    timestamp: new Date().toISOString(),
    lastTimestamp: undefined,
    upcoming: []
  }
);

// Wait for completion
const result = await handle.pollUntilCompleted();
console.log('Sync report:', result.output);
```

### Monitoring
The task logs extensively at each stage:
- Data source discovery
- Sync job creation
- Individual job processing
- Error details
- Final summary report

Check Trigger.dev dashboard for:
- Execution history
- Error logs
- Performance metrics
- Retry attempts

## Error Handling

### Graceful Degradation
- Continues processing other data sources if one fails
- Continues processing other columns if individual syncs fail
- Always generates a report, even on partial failure

### Error Tracking
- Each error is logged with context
- Failed jobs are marked in the database
- Summary report includes all errors encountered

### Retry Logic
- Main task: 3 attempts with exponential backoff
- Individual jobs: 3 attempts with exponential backoff
- Failed jobs can be retried in the next daily run

## Development

### Testing the Schedule
```bash
# Run in development mode
npm run dev

# The task will be registered and visible in Trigger.dev dashboard
# You can manually trigger it from the dashboard for testing
```

### Adding New Features
1. Update types in `types.ts`
2. Modify orchestration logic in `sync-searchable-values.ts`
3. Implement sync logic in `process-sync-job.ts` (Ticket 8)
4. Update this README

### Environment Variables
Required (set at monorepo root):
- `TRIGGER_PROJECT_ID` - Trigger.dev project ID
- `TRIGGER_API_KEY` - Trigger.dev API key
- `DATABASE_URL` - PostgreSQL connection string

## Implementation Status

### ✅ Completed (Ticket 7)
- Daily cron schedule setup
- Data source discovery logic
- Sync job creation and tracking
- Batch processing orchestration
- Error handling and reporting
- Comprehensive type definitions

### 🚧 TODO (Ticket 8)
- Actual sync implementation in `process-sync-job.ts`
- Data source connection handling
- Value extraction queries
- Cache storage integration
- Column metadata updates

## Performance Considerations

- **Batching**: Processes columns in batches to avoid overwhelming the system
- **Timeouts**: Each job has a 5-minute timeout to prevent hanging
- **Concurrency**: Limited concurrent jobs to manage resource usage
- **Caching**: Values are cached to avoid redundant queries

## Security

- No credentials are stored in the task
- Database connections are managed by the data-source package
- All inputs are validated with Zod schemas
- Errors don't expose sensitive information

## Related Documentation

- [Trigger.dev v4 Documentation](https://trigger.dev/docs)
- [Database Query Helpers](/packages/database/src/queries/sync-jobs/README.md)
- [Searchable Values System Design](/docs/searchable-values-sync.md)