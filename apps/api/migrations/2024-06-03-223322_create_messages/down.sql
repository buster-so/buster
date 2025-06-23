-- This file should undo anything in `up.sql`
drop table if exists messages;
drop type if exists message_feedback_enum;
drop type if exists verification_enum;

