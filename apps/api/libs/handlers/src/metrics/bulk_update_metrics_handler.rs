use anyhow::Result;
use database::helpers::metric_files::fetch_metric_files_with_permissions;
use futures::future::join_all;
use middleware::AuthenticatedUser;
use sharing::check_permission_access;
use database::enums::AssetPermissionRole;
use std::collections::HashMap;
use uuid::Uuid;

use crate::metrics::types::{BulkUpdateMetricsResponse, FailedMetricUpdate, MetricStatusUpdate, BusterMetric};
use crate::metrics::update_metric_handler::{update_metric_handler, UpdateMetricRequest};

/// Map error to a client-friendly error code
/// 
/// # Arguments
/// * `error` - The error to map
/// 
/// # Returns
/// * `String` - A normalized error code for the client
fn map_error_to_code(error: &anyhow::Error) -> String {
    let error_msg = error.to_string().to_lowercase();
    
    // Check for permission/access errors first
    if error_msg.contains("permission") || error_msg.contains("access") {
        "PERMISSION_DENIED".to_string()
    } 
    // Check for not found errors
    else if error_msg.contains("not found") {
        "NOT_FOUND".to_string()
    } 
    // Check for connection/timeout errors
    else if error_msg.contains("timeout") || error_msg.contains("connection") {
        "CONNECTION_ERROR".to_string()
    } 
    // Check for validation errors
    else if error_msg.contains("validation") {
        "VALIDATION_ERROR".to_string()
    } 
    // Default to internal error
    else {
        "INTERNAL_ERROR".to_string()
    }
}

/// Process a single metric status update
/// 
/// This function handles permission checking and applies the update to a single metric
/// 
/// # Arguments
/// * `update` - The metric update to process
/// * `user` - The authenticated user
/// 
/// # Returns
/// * `Result<BusterMetric>` - The updated metric or an error
async fn process_single_update(
    update: &MetricStatusUpdate,
    user: &AuthenticatedUser,
) -> Result<BusterMetric> {
    // Create an update request with just the verification status
    let request = UpdateMetricRequest {
        verification: Some(update.verification),
        update_version: Some(false),
        ..UpdateMetricRequest::default()
    };
    
    // Update the metric using existing handler
    update_metric_handler(&update.id, user, request).await
}

/// Handler for bulk updating multiple metric statuses in a single operation
/// 
/// This handler concurrently processes multiple metric status updates, handling
/// permissions and validation for each metric individually. Updates are processed
/// in batches for performance and resource management.
/// 
/// # Arguments
/// * `updates` - Vector of metric status updates to process
/// * `batch_size` - Optional batch size (number of metrics to process concurrently)
/// * `user` - The authenticated user making the request
/// 
/// # Returns
/// * `Result<BulkUpdateMetricsResponse>` - Response with success/failure details
pub async fn bulk_update_metrics_handler(
    updates: Vec<MetricStatusUpdate>,
    batch_size: Option<usize>,
    user: &AuthenticatedUser,
) -> Result<BulkUpdateMetricsResponse> {
    if updates.is_empty() {
        return Ok(BulkUpdateMetricsResponse {
            updated_metrics: Vec::new(),
            failed_updates: Vec::new(),
            total_processed: 0,
            success_count: 0,
            failure_count: 0,
        });
    }
    
    // Use the provided batch_size or default to 50, and ensure it's within limits
    let batch_size = batch_size.unwrap_or(50).clamp(1, 100); 
    
    tracing::info!(
        user_id = %user.id,
        update_count = updates.len(),
        batch_size = batch_size,
        "Starting bulk metric status update"
    );

    // Pre-fetch permissions for all metrics to identify access issues upfront
    let metric_ids: Vec<Uuid> = updates.iter().map(|update| update.id).collect();
    let metrics_with_permissions = fetch_metric_files_with_permissions(&metric_ids, &user.id).await?;
    
    // Create a mapping of metric ID to permission for quick lookup
    let mut permission_map = HashMap::new();
    for metric_with_permission in metrics_with_permissions {
        permission_map.insert(
            metric_with_permission.metric_file.id,
            (
                metric_with_permission.permission,
                metric_with_permission.metric_file.organization_id,
            ),
        );
    }
    
    let mut updated_metrics = Vec::with_capacity(updates.len());
    let mut failed_updates = Vec::new();

    // Process in batches for better resource management
    for chunk in updates.chunks(batch_size) {
        let mut futures = Vec::with_capacity(chunk.len());
        
        // Start processing each update in the chunk
        for update in chunk {
            // Check if we have permission info for this metric
            match permission_map.get(&update.id) {
                Some((Some(permission), organization_id)) => {
                    // Check if user has sufficient permission
                    if check_permission_access(
                        Some(*permission),
                        &[
                            AssetPermissionRole::CanEdit,
                            AssetPermissionRole::FullAccess,
                            AssetPermissionRole::Owner,
                        ],
                        *organization_id,
                        &user.organizations,
                    ) {
                        // User has permission, process the update
                        futures.push(process_single_update(update, user));
                    } else {
                        // User doesn't have sufficient permission
                        failed_updates.push(FailedMetricUpdate {
                            metric_id: update.id,
                            error: "Insufficient permission to update this metric".to_string(),
                            error_code: "PERMISSION_DENIED".to_string(),
                        });
                    }
                }
                Some((None, _)) => {
                    // Metric exists but user has no permission
                    failed_updates.push(FailedMetricUpdate {
                        metric_id: update.id,
                        error: "No permission to access this metric".to_string(),
                        error_code: "PERMISSION_DENIED".to_string(),
                    });
                }
                None => {
                    // Metric not found in our prefetch results
                    failed_updates.push(FailedMetricUpdate {
                        metric_id: update.id,
                        error: "Metric not found".to_string(),
                        error_code: "NOT_FOUND".to_string(),
                    });
                }
            }
        }
        
        // Wait for all updates in this batch to complete
        let results = join_all(futures).await;
        
        // Process results
        for result in results {
            match result {
                Ok(metric) => updated_metrics.push(metric),
                Err(e) => {
                    // This should be rare since we pre-check permissions,
                    // but could happen due to race conditions or other errors
                    let metric_id = Uuid::nil(); // We don't know which one failed here
                    tracing::warn!(
                        error = %e,
                        "Failed to update metric status"
                    );
                    failed_updates.push(FailedMetricUpdate {
                        metric_id,
                        error: e.to_string(),
                        error_code: map_error_to_code(&e),
                    });
                }
            }
        }
    }

    // Return the final response with all results
    Ok(BulkUpdateMetricsResponse {
        total_processed: updates.len(),
        success_count: updated_metrics.len(),
        failure_count: failed_updates.len(),
        updated_metrics,
        failed_updates,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_code_mapping() {
        // The access keyword triggers the permission check
        let access_error = anyhow::anyhow!("No access to this resource");
        assert_eq!(map_error_to_code(&access_error), "PERMISSION_DENIED");
        
        // Test permission error with 'permission' keyword
        let permission_error = anyhow::anyhow!("User doesn't have permission to update this metric");
        assert_eq!(map_error_to_code(&permission_error), "PERMISSION_DENIED");
        
        // Test not found error
        let not_found_error = anyhow::anyhow!("Metric not found");
        assert_eq!(map_error_to_code(&not_found_error), "NOT_FOUND");
        
        // Test connection error - checking "timeout" in the error message
        // Make sure there's no 'permission' or 'access' word in the error
        let timeout_error = anyhow::anyhow!("Query timeout occurred");
        assert_eq!(map_error_to_code(&timeout_error), "CONNECTION_ERROR");
        
        // Test connection error - checking "connection" in the error message
        // Make sure there's no 'permission' or 'access' word in the error
        let connection_error = anyhow::anyhow!("Database connection failed");
        assert_eq!(map_error_to_code(&connection_error), "CONNECTION_ERROR");
        
        // Test validation error
        let validation_error = anyhow::anyhow!("Validation failed: invalid input");
        assert_eq!(map_error_to_code(&validation_error), "VALIDATION_ERROR");
        
        // Test generic error
        let generic_error = anyhow::anyhow!("Something unexpected happened");
        assert_eq!(map_error_to_code(&generic_error), "INTERNAL_ERROR");
    }
}