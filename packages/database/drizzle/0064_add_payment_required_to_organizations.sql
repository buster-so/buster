-- Migration: add_payment_required_to_organizations
-- Created: 2025-04-21-231239
-- Original: 2025-04-21-231239_add_payment_required_to_organizations

ALTER TABLE organizations
ADD COLUMN payment_required BOOLEAN NOT NULL DEFAULT false;