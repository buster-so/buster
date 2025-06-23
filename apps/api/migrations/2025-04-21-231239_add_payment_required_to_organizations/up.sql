-- Your SQL goes here
ALTER TABLE organizations
ADD COLUMN payment_required BOOLEAN NOT NULL DEFAULT false;
