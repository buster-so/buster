-- This file should undo anything in `up.sql`
drop table if exists users_to_organizations;

drop type if exists user_organization_role_enum;

drop type if exists sharing_setting_enum;