use database::enums::{AssetPermissionRole, UserOrganizationRole};
use middleware::OrganizationMembership;
use uuid::Uuid;

/// Checks if a user has sufficient permissions based on organization roles and asset permissions.
///
/// # Arguments
/// * `current_permission_level` - Optional current permission level of the user for the asset
/// * `required_permission_level` - Required permission level to access the asset
/// * `organization_id` - UUID of the organization
/// * `organization_role_grants` - Array of tuples containing (UUID, UserOrganizationRole) for the user
///
/// # Returns
/// * `bool` - True if the user has sufficient permissions, false otherwise
pub fn check_permission_access(
    current_permission_level: Option<AssetPermissionRole>,
    required_permission_level: &[AssetPermissionRole],
    organization_id: Uuid,
    organization_role_grants: &[OrganizationMembership],
) -> bool {
    // First check if the user has WorkspaceAdmin or DataAdmin role for the organization
    for org in organization_role_grants {
        if org.id == organization_id
            && (org.role == UserOrganizationRole::WorkspaceAdmin
                || org.role == UserOrganizationRole::DataAdmin)
        {
            return true;
        }
    }

    // Then check if the user has the required permission level
    if let Some(permission) = current_permission_level {
        if required_permission_level.contains(&permission) {
            return true;
        }
    }

    // If none of the above conditions are met, return false
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_workspace_admin_access() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::WorkspaceAdmin
        }];

        assert!(check_permission_access(
            None,
            &[AssetPermissionRole::Owner],
            org_id,
            &grants
        ));
    }

    #[test]
    fn test_data_admin_access() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::DataAdmin
        }];

        assert!(check_permission_access(
            None,
            &[AssetPermissionRole::Owner],
            org_id,
            &grants
        ));
    }

    #[test]
    fn test_matching_permission_level() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::Viewer
        }];

        assert!(check_permission_access(
            Some(AssetPermissionRole::CanEdit),
            &[AssetPermissionRole::CanEdit],
            org_id,
            &grants
        ));
    }

    #[test]
    fn test_insufficient_permissions() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::Viewer
        }];

        assert!(!check_permission_access(
            Some(AssetPermissionRole::CanView),
            &[AssetPermissionRole::CanEdit],
            org_id,
            &grants
        ));
    }

    #[test]
    fn test_no_permissions() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::Viewer
        }];

        assert!(!check_permission_access(
            None,
            &[AssetPermissionRole::CanView],
            org_id,
            &grants
        ));
    }
}
