-- This file should undo anything in `up.sql`
drop table if exists asset_permissions;

drop type if exists asset_permission_role_enum;

drop type if exists asset_type_enum;

drop type if exists identity_type_enum;