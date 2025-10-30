import { relative } from 'node:path';
import type { deploy } from '@buster/server-shared';
import type { CLIDeploymentResult, Model } from '../schemas';

type UnifiedDeployResponse = deploy.UnifiedDeployResponse;

/**
 * Pure function to merge multiple deployment results into one
 */
export function mergeDeploymentResults(results: CLIDeploymentResult[]): CLIDeploymentResult {
  return results.reduce(
    (acc, result) => {
      // Merge model results
      const base: CLIDeploymentResult = {
        success: [...acc.success, ...result.success],
        updated: [...acc.updated, ...result.updated],
        noChange: [...acc.noChange, ...result.noChange],
        failures: [...acc.failures, ...result.failures],
        excluded: [...acc.excluded, ...result.excluded],
        todos: [...acc.todos, ...(result.todos || [])],
      };

      // Merge doc results if present
      if (result.docs || acc.docs) {
        const created = [...(acc.docs?.created || []), ...(result.docs?.created || [])];
        const updated = [...(acc.docs?.updated || []), ...(result.docs?.updated || [])];
        const deleted = [...(acc.docs?.deleted || []), ...(result.docs?.deleted || [])];
        const failed = [...(acc.docs?.failed || []), ...(result.docs?.failed || [])];

        base.docs = {
          created,
          updated,
          deleted,
          failed,
          summary: {
            totalDocs: created.length + updated.length,
            createdCount: created.length,
            updatedCount: updated.length,
            deletedCount: deleted.length,
            failedCount: failed.length,
          },
        };
      }

      // Merge automation results if present
      if (result.automation || acc.automation) {
        const accAgentCount = acc.automation?.agentCount || 0;
        const accTriggerCount = acc.automation?.triggerCount || 0;
        const resultAgentCount = result.automation?.agentCount || 0;
        const resultTriggerCount = result.automation?.triggerCount || 0;

        const configured =
          acc.automation?.configured || false || result.automation?.configured || false;
        const agentCount = accAgentCount + resultAgentCount;
        const triggerCount = accTriggerCount + resultTriggerCount;

        // Collect errors from both results
        const errors: string[] = [];
        if (acc.automation?.error) {
          errors.push(acc.automation.error);
        }
        if (result.automation?.error) {
          errors.push(result.automation.error);
        }

        base.automation = {
          configured,
          agentCount: agentCount > 0 ? agentCount : undefined,
          triggerCount: triggerCount > 0 ? triggerCount : undefined,
          error: errors.length > 0 ? errors.join('; ') : undefined,
        };
      }

      return base;
    },
    {
      success: [],
      updated: [],
      noChange: [],
      failures: [],
      excluded: [],
      todos: [],
    } as CLIDeploymentResult
  );
}

/**
 * Pure function to process unified deployment response into CLI result format
 * Now handles both models and docs from the unified response
 */
export function processDeploymentResponse(
  response: UnifiedDeployResponse,
  modelFileMap: Map<string, string>,
  _docFileMap: Map<string, string>
): CLIDeploymentResult {
  const result: CLIDeploymentResult = {
    success: [],
    updated: [],
    noChange: [],
    failures: [],
    excluded: [],
    todos: [],
  };

  // Process model results
  if (response.models) {
    // Process successful deployments
    for (const item of response.models.success) {
      result.success.push({
        file: modelFileMap.get(item.name) || 'unknown',
        modelName: item.name,
        dataSource: item.dataSource || 'unknown',
      });
    }

    // Process updated deployments
    for (const item of response.models.updated) {
      result.updated.push({
        file: modelFileMap.get(item.name) || 'unknown',
        modelName: item.name,
        dataSource: item.dataSource || 'unknown',
      });
    }

    // Process failures
    for (const failure of response.models.failures) {
      result.failures.push({
        file: modelFileMap.get(failure.name) || 'unknown',
        modelName: failure.name,
        errors: failure.errors,
      });
    }
  }

  // Process doc results
  if (response.docs) {
    result.docs = {
      created: response.docs.created || [],
      updated: response.docs.updated || [],
      deleted: response.docs.deleted || [],
      failed: response.docs.failed || [],
      summary: response.docs.summary || {
        totalDocs: 0,
        createdCount: 0,
        updatedCount: 0,
        deletedCount: 0,
        failedCount: 0,
      },
    };
  }

  // Process automation results
  if (response.automation) {
    result.automation = response.automation;
  }

  return result;
}

/**
 * Pure function to format deployment summary for display
 */
export function formatDeploymentSummary(
  result: CLIDeploymentResult,
  verbose = false,
  isDryRun = false
): string {
  const lines: string[] = [];

  // Calculate totals
  const totalSuccess = result.success.length + result.updated.length + result.noChange.length;
  const totalFailed = result.failures.length;
  const totalTodos = result.todos?.length || 0;
  const totalExcluded = result.excluded.length;

  // Header with mode indicator
  lines.push('');
  lines.push(isDryRun ? 'Deployment Results (DRY RUN)' : 'Deployment Results');
  lines.push('─'.repeat(29));

  // Models deployed summary
  if (totalSuccess > 0) {
    lines.push(`  ${totalSuccess} ${totalSuccess === 1 ? 'model' : 'models'} deployed`);
    if (result.success.length > 0) {
      lines.push(`    • ${result.success.length} new`);
    }
    if (result.updated.length > 0) {
      lines.push(`    • ${result.updated.length} updated`);
    }
    if (result.noChange.length > 0) {
      lines.push(`    • ${result.noChange.length} unchanged`);
    }

    // Only show model details in verbose mode
    if (verbose) {
      if (result.success.length > 0) {
        lines.push('    New models:');
        for (const model of result.success.slice(0, 5)) {
          lines.push(`      - ${model.modelName} (${model.file})`);
        }
        if (result.success.length > 5) {
          lines.push(`      ... and ${result.success.length - 5} more`);
        }
      }
      if (result.updated.length > 0) {
        lines.push('    Updated models:');
        for (const model of result.updated.slice(0, 5)) {
          lines.push(`      - ${model.modelName} (${model.file})`);
        }
        if (result.updated.length > 5) {
          lines.push(`      ... and ${result.updated.length - 5} more`);
        }
      }
      if (result.noChange.length > 0) {
        lines.push('    Unchanged models:');
        for (const model of result.noChange.slice(0, 5)) {
          lines.push(`      - ${model.modelName} (${model.file})`);
        }
        if (result.noChange.length > 5) {
          lines.push(`      ... and ${result.noChange.length - 5} more`);
        }
      }
    }
  } else if (totalFailed === 0 && totalTodos === 0) {
    lines.push('  No models to deploy');
  }

  // Docs deployed summary
  if (result.docs) {
    const totalDocs = (result.docs.created?.length || 0) + (result.docs.updated?.length || 0);
    if (totalDocs > 0 || result.docs.deleted?.length > 0) {
      lines.push('');
      lines.push(`  ${totalDocs} ${totalDocs === 1 ? 'doc' : 'docs'} deployed`);
      if (result.docs.created?.length > 0) {
        lines.push(`    • ${result.docs.created.length} new`);
      }
      if (result.docs.updated?.length > 0) {
        lines.push(`    • ${result.docs.updated.length} updated`);
      }
      if (result.docs.deleted?.length > 0) {
        lines.push(`    • ${result.docs.deleted.length} deleted`);
      }

      // Only show file details in verbose mode
      if (verbose) {
        if (result.docs.created?.length > 0) {
          lines.push('    New docs:');
          for (const doc of result.docs.created.slice(0, 5)) {
            lines.push(`      - ${doc}`);
          }
          if (result.docs.created.length > 5) {
            lines.push(`      ... and ${result.docs.created.length - 5} more`);
          }
        }
        if (result.docs.updated?.length > 0) {
          lines.push('    Updated docs:');
          for (const doc of result.docs.updated.slice(0, 5)) {
            lines.push(`      - ${doc}`);
          }
          if (result.docs.updated.length > 5) {
            lines.push(`      ... and ${result.docs.updated.length - 5} more`);
          }
        }
        if (result.docs.deleted?.length > 0) {
          lines.push('    Deleted docs:');
          for (const doc of result.docs.deleted.slice(0, 5)) {
            lines.push(`      - ${doc}`);
          }
          if (result.docs.deleted.length > 5) {
            lines.push(`      ... and ${result.docs.deleted.length - 5} more`);
          }
        }
      }
    }

    // Doc failures
    if (result.docs.failed?.length > 0) {
      lines.push('');
      lines.push(
        `  ${result.docs.failed.length} ${result.docs.failed.length === 1 ? 'doc' : 'docs'} failed:`
      );
      for (const failure of result.docs.failed.slice(0, verbose ? 10 : 3)) {
        lines.push(`    • ${failure.name}: ${failure.error}`);
      }
      if (result.docs.failed.length > (verbose ? 10 : 3)) {
        lines.push(`    ... and ${result.docs.failed.length - (verbose ? 10 : 3)} more`);
      }
    }
  }

  // Automation section - show if configured or verbose
  if (result.automation) {
    const agentCount = result.automation.agentCount || 0;
    const triggerCount = result.automation.triggerCount || 0;

    if (result.automation.configured) {
      lines.push('');
      lines.push(
        `  ${agentCount + triggerCount} automation ${agentCount + triggerCount === 1 ? 'item' : 'items'} deployed`
      );

      if (agentCount > 0) {
        lines.push(`    • ${agentCount} ${agentCount === 1 ? 'agent' : 'agents'} configured`);
      }
      if (triggerCount > 0) {
        lines.push(
          `    • ${triggerCount} ${triggerCount === 1 ? 'trigger' : 'triggers'} configured`
        );
      }

      if (verbose && (agentCount > 0 || triggerCount > 0)) {
        lines.push('    Status:');
        lines.push('      ✓ Automation configured successfully');
        if (agentCount > 0) {
          lines.push(
            `      ✓ ${agentCount} ${agentCount === 1 ? 'agent' : 'agents'} ready for CI/CD events`
          );
        }
        if (triggerCount > 0) {
          lines.push(
            `      ✓ ${triggerCount} event ${triggerCount === 1 ? 'trigger' : 'triggers'} configured`
          );
        }
      }
    } else {
      if (verbose || result.automation.error) {
        lines.push('');
        lines.push('  0 automation items deployed');
        if (verbose) {
          lines.push('    • No automation configuration found');
          lines.push('    • Existing automation (if any) will be removed');
        }
      }
    }

    if (result.automation.error) {
      lines.push(`    ⚠ Error: ${result.automation.error}`);
    }
  } else {
    lines.push('  No automation agents/triggers to deploy');
  }

  // Failures section
  if (totalFailed > 0) {
    lines.push('');
    lines.push(`  ${totalFailed} ${totalFailed === 1 ? 'model' : 'models'} failed:`);

    // Group failures by error message for better readability
    const failuresByError = groupFailuresByError(result.failures);

    // Sort by number of occurrences (most common errors first)
    const sortedErrors = Array.from(failuresByError.entries()).sort(
      (a, b) => b[1].length - a[1].length
    );

    // Show grouped errors
    const maxErrors = verbose ? sortedErrors.length : 3;
    let errorCount = 0;

    for (const [errorMsg, affectedModels] of sortedErrors) {
      if (errorCount >= maxErrors) break;
      errorCount++;

      lines.push('');
      lines.push(`    ${errorMsg}`);
      lines.push(`    Affected models (${affectedModels.length}):`);

      // Show affected models
      const maxModels = verbose ? affectedModels.length : 5;
      for (let i = 0; i < Math.min(maxModels, affectedModels.length); i++) {
        const model = affectedModels[i];
        if (!model) continue;
        const displayName = verbose ? model.file : model.file.split('/').pop() || model.file;
        lines.push(`      • ${model.modelName} (${displayName})`);
      }

      if (affectedModels.length > maxModels) {
        lines.push(`      ... and ${affectedModels.length - maxModels} more`);
      }
    }

    if (sortedErrors.length > maxErrors) {
      const remainingCount = sortedErrors
        .slice(maxErrors)
        .reduce((sum, [, models]) => sum + models.length, 0);
      lines.push('');
      lines.push(
        `    ... and ${remainingCount} more failures with ${sortedErrors.length - maxErrors} different error${sortedErrors.length - maxErrors === 1 ? '' : 's'}`
      );
    }
  }

  // TODOs section
  if (totalTodos > 0) {
    lines.push('');
    lines.push(`  ${totalTodos} ${totalTodos === 1 ? 'file needs' : 'files need'} completion:`);

    const maxTodos = verbose ? result.todos.length : 5;
    for (let i = 0; i < Math.min(maxTodos, result.todos.length); i++) {
      const todo = result.todos[i];
      if (!todo) continue;
      // Show full paths in verbose mode, just filename otherwise
      const displayPath = verbose ? todo.file : todo.file.split('/').pop() || todo.file;
      lines.push(`    ${displayPath}`);
    }

    if (result.todos.length > maxTodos) {
      lines.push(`    ... and ${result.todos.length - maxTodos} more`);
    }
  }

  // Excluded section (only in verbose mode)
  if (verbose && totalExcluded > 0) {
    lines.push('');
    lines.push(`  ${totalExcluded} ${totalExcluded === 1 ? 'file' : 'files'} excluded:`);

    for (const excluded of result.excluded) {
      // Show full paths in verbose mode
      const displayName = verbose ? excluded.file : excluded.file.split('/').pop() || excluded.file;
      lines.push(`    ${displayName}: ${excluded.reason}`);
    }
  }

  // Final status line
  lines.push('');
  const docFailures = result.docs?.failed?.length || 0;
  const totalAllFailures = totalFailed + docFailures;

  if (totalAllFailures > 0) {
    const mode = isDryRun ? 'Dry run' : 'Deployment';
    lines.push(
      `✗ ${mode} completed with ${totalAllFailures} error${totalAllFailures === 1 ? '' : 's'}`
    );
    if (!verbose) {
      lines.push('  Run with --verbose for full error details');
    }
  } else if (totalTodos > 0) {
    const mode = isDryRun ? 'Dry run' : 'Deployment';
    lines.push(
      `⚠ ${mode} completed with ${totalTodos} file${totalTodos === 1 ? '' : 's'} needing completion`
    );
  } else if (
    totalSuccess === 0 &&
    (!result.docs || (result.docs.created?.length || 0) + (result.docs.updated?.length || 0) === 0)
  ) {
    lines.push('⚠ No models or docs found to deploy');
  } else {
    const mode = isDryRun ? 'Dry run' : 'Deployment';
    lines.push(`✓ ${mode} completed successfully`);
  }

  return lines.join('\n');
}

/**
 * Group failures by error message for better readability
 */
function groupFailuresByError(
  failures: Array<{ file: string; modelName: string; errors: string[] }>
): Map<string, Array<{ file: string; modelName: string }>> {
  const grouped = new Map<string, Array<{ file: string; modelName: string }>>();

  for (const failure of failures) {
    for (const error of failure.errors) {
      const key = extractErrorMessage(error);
      const existing = grouped.get(key) || [];
      existing.push({ file: failure.file, modelName: failure.modelName });
      grouped.set(key, existing);
    }
  }

  return grouped;
}

/**
 * Extract meaningful error message from verbose database errors
 */
function extractErrorMessage(error: string): string {
  // Already parsed errors from the server
  if (error.includes('Data source') && error.includes('not found')) {
    return error; // Already user-friendly
  }
  if (error.includes('No access to data source')) {
    return error; // Already user-friendly
  }
  if (error.includes('Contact your administrator')) {
    return error; // Already user-friendly
  }

  // Handle SQL update errors with large parameter lists
  if (error.includes('Failed query:')) {
    // Try to extract just the error reason after the params
    const paramsMatch = error.match(/params:.*?([A-Z][^,]*error[^,]*)/i);
    if (paramsMatch?.[1]) {
      return paramsMatch[1].trim();
    }

    // Look for common database error patterns
    if (error.includes('duplicate key')) {
      return 'Duplicate key error - model may already exist';
    }
    if (error.includes('foreign key')) {
      return 'Foreign key constraint violation';
    }
    if (error.includes('not null')) {
      return 'Required field is missing (NOT NULL constraint)';
    }
    if (error.includes('unique constraint')) {
      return 'Unique constraint violation';
    }

    // If it's a long query error, just show the first part
    const lines = error.split('\n');
    const firstLine = lines[0];
    if (firstLine && firstLine.length > 100) {
      return `${firstLine.substring(0, 100)}...`;
    }
    return firstLine || 'Database error';
  }

  // For other errors, truncate if too long
  if (error.length > 150) {
    return `${error.substring(0, 150)}...`;
  }

  return error;
}

/**
 * Display deployment result in CLI
 */
export function displayDeploymentResults(
  result: CLIDeploymentResult,
  verbose = false,
  isDryRun = false
): void {
  const summary = formatDeploymentSummary(result, verbose, isDryRun);
  console.info(summary);
}

/**
 * Create model-to-file mapping from deployment data
 */
export function createModelFileMap(
  fileModels: Array<{ file: string; models: Model[] }>
): Map<string, string> {
  const map = new Map<string, string>();

  for (const { file, models } of fileModels) {
    for (const model of models) {
      map.set(model.name, file);
    }
  }

  return map;
}

/**
 * Convert parse failures to CLI deployment failures
 */
export function createParseFailures(
  failures: Array<{ file: string; error: string }>,
  baseDir: string
): Array<{ file: string; modelName: string; errors: string[] }> {
  return failures.map((failure) => ({
    file: failure.file.includes('/') ? relative(baseDir, failure.file) : failure.file,
    modelName: 'parse_error',
    errors: [failure.error],
  }));
}
