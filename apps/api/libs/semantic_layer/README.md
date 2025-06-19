# Model Schema Documentation

This document describes a YAML-based schema for defining data models, designed for an AI data analyst (LLM) to interpret and generate SQL queries. The schema supports complex multi-table relationships, filters, and metrics, aiming for simplicity, clarity, and LLM usability while mirroring business entities (e.g., Palantir ontology inspiration).

## Overview
- **Purpose**: Digitally clone a business by modeling entities (tables/models), their attributes, relationships, and analytical logic.
- **Key Features**:
  - Modular models with dimensions, measures, metrics, filters, and entities.
  - Multi-table `filters` and `metrics` using columns from related models via `entities`.
  - Parameterized `filters` and `metrics` for dynamic queries.
  - Structured `entities` for reliable join parsing.

## Top-Level Structure
- **`models`**: Array of model objects, each representing a table or view.

### Model Fields
- **`name`** (required, string): Unique model identifier (e.g., `culture`).
- **`description`** (optional, string): Human-readable description.

### Dimensions
Filterable fields or identifiers (e.g., categorical attributes).

- **`name`** (required, string): Column name in the data source.
- **`description`** (optional, string): Field explanation.
- **`type`** (optional, string): Data type (e.g., `character`); inferred if omitted.
- **`searchable`** (optional, boolean, default: `false`): Index for search.
- **`options`** (optional, array of strings, default: `null`): Valid values (e.g., `["active", "inactive"]`).

### Measures
Raw quantitative fields for analysis.

- **`name`** (required, string): Column name in the data source.
- **`description`** (optional, string): Field explanation.
- **`type`** (optional, string): Data type (e.g., `integer`); inferred if omitted.

### Metrics
Aggregated or derived values, optionally parameterized.

- **`name`** (required, string): Metric name (e.g., `total_revenue`).
- **`expr`** (required, string): Expression (e.g., `SUM(revenue)`). Can use `model.column` syntax (e.g., `logins.login_count`) for entity columns.
- **`description`** (optional, string): Metric explanation.
- **`args`** (optional, array of objects, default: `null`):
  - **`name`** (required, string): Argument name (e.g., `days`).
  - **`type`** (required, string): Data type (e.g., `integer`).
  - **`description`** (optional, string): Argument purpose.
- **Notes**: For `many-to-many` relationships, pre-aggregate entity data to avoid duplication (e.g., use a subquery).

### Filters
Reusable boolean conditions, optionally parameterized.

- **`name`** (required, string): Filter name (e.g., `active_customer`).
- **`expr`** (required, string): Boolean expression (e.g., `login_count > 1`). Can use `model.column` for entity columns.
- **`description`** (optional, string): Filter explanation.
- **`args`** (optional, array of objects, default: `null`):
  - **`name`** (required, string): Argument name.
  - **`type`** (required, string): Data type.
  - **`description`** (optional, string): Argument purpose.
- **Notes**: Use `EXISTS` or subqueries for `many-to-many` to preserve intent without duplication.

### Entities
Relationships to other models, enabling multi-table joins.

- **`name`** (required, string): Related model name (e.g., `logins`).
- **`primary_key`** (required, string): Current model’s join column (e.g., `cultureid`).
- **`foreign_key`** (required, string): Entity model’s join column (e.g., `cultureid`).
- **`type`** (optional, string): Join type (`LEFT`, `INNER`, `RIGHT`, `FULL`); LLM decides if omitted based on `expr` context.
- **`cardinality`** (optional, string, default: `null`): Relationship type (e.g., `one-to-many`, `many-to-many`).
- **`description`** (optional, string): Relationship explanation.
- **Notes**:
  - Join is `<current>.<primary_key> = <entity>.<foreign_key>` with LLM-chosen `type`.
  - `cardinality` hints at duplication risk (e.g., `many-to-many` may need subqueries).

## SQL Compilation
- **Joins**: Use `entities` to join models, with LLM selecting `type` if unspecified.
- **Many-to-Many**:
  - Pre-aggregate entity data (e.g., `GROUP BY cultureid`) or use `EXISTS` to avoid duplicating base rows.
  - Example: `SELECT SUM(revenue) FROM culture WHERE EXISTS (SELECT 1 FROM culture_products WHERE ...)`.

## Design Choices
- **Option 3**: `filters` and `metrics` can reference entity columns, reducing model sprawl.
- **Key Pairs**: `primary_key`/`foreign_key` over `join_on` for structured parsing and LLM ease.
- **Dynamic Joins**: Optional `type` lets the LLM adapt to query context, balancing flexibility and simplicity.