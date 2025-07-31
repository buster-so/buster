# Schema Sync Task

## Overview

The Schema Sync task is a scheduled Trigger.dev v3 task that runs daily at midnight MST to validate customer data source schemas against their dataset YML configurations.

## Features

- **Daily Schedule**: Runs automatically at midnight MST (7:00 UTC)
- **Lightweight Introspection**: Groups datasets by database/schema to minimize queries
- **Discrepancy Detection**: Identifies missing columns and type mismatches
- **Slack Notifications**: Sends alerts to organization channels and data team
- **Message Tracking**: Records all notifications in the database

## Task Flow

1. **Fetch Active Organizations**: Gets all organizations with completed onboarding and data sources
2. **Process Each Organization**:
   - For each data source:
     - Get datasets with YML content
     - Group by database/schema for efficiency
     - Introspect schema once per group
     - Compare against YML definitions
3. **Send Notifications**:
   - Organization-specific alerts for discrepancies
   - Daily summary to data team
4. **Track Messages**: Store all sent messages in `slack_message_tracking` table

## Discrepancy Types

- **Critical** (🔴): Missing columns that will cause queries to fail
- **Warning** (🟡): Type mismatches that may cause issues
- **Info** (🔵): Minor issues (not currently implemented)

## Configuration

### Environment Variables

```bash
# Data team Slack configuration
DATA_TEAM_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DATA_TEAM_SLACK_CHANNEL_ID=#data-team-alerts
```

### Cron Schedule

The task runs at `0 7 * * *` (7:00 UTC / midnight MST daily).

## Error Handling

- Continues processing other organizations if one fails
- Sends error notifications when possible
- Logs all errors with context
- Returns partial results on failure

## Database Dependencies

- `organizations` - Active organizations
- `data_sources` - Customer data source configurations
- `datasets` - Dataset configurations with YML content
- `slack_integrations` - Organization Slack settings
- `slack_message_tracking` - Message audit trail

## Example Output

```typescript
{
  success: true,
  timestamp: "2024-01-15T07:00:00Z",
  result: {
    success: true,
    executionTimeMs: 45000,
    organizationsProcessed: 10,
    totalDiscrepancies: 25,
    criticalIssues: 5,
    warnings: 20,
    notificationsSent: 8,
    errors: []
  }
}
```

## Development

### Running Locally

```bash
# Test the task
npm run dev

# Trigger manually (requires Trigger.dev CLI)
npx trigger.dev run schema-sync
```

### Testing

Unit tests are located in `schema-sync.test.ts` and cover:
- Organization processing logic
- Discrepancy detection
- Notification formatting
- Error scenarios

## Monitoring

Monitor task execution through:
- Trigger.dev dashboard
- CloudWatch logs (search for `schema-sync`)
- Slack notifications in data team channel
- Database queries on `slack_message_tracking`