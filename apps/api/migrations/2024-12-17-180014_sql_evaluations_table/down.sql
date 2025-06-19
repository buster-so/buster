-- This file should undo anything in `up.sql`
alter table
    messages drop column sql_evaluation_id;

drop table sql_evaluations;