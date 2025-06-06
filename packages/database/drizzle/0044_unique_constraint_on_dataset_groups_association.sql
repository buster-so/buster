-- Migration: unique_constraint_on_dataset_groups_association
-- Created: 2025-01-21-172028
-- Original: 2025-01-21-172028_unique_constraint_on_dataset_groups_association

ALTER TABLE dataset_groups_permissions 
ADD CONSTRAINT unique_dataset_group_permission 
UNIQUE (dataset_group_id, permission_id, permission_type);