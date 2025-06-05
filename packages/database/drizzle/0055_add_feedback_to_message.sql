-- Migration: add_feedback_to_message
-- Created: 2025-03-20-220600
-- Original: 2025-03-20-220600_add_feedback_to_message

alter table messages add column feedback text null;