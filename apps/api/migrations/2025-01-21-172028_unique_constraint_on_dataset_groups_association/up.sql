-- Your SQL goes here
ALTER TABLE dataset_groups_permissions 
ADD CONSTRAINT unique_dataset_group_permission 
UNIQUE (dataset_group_id, permission_id, permission_type);