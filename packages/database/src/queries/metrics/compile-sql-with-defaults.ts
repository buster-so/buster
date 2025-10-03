import type { MetricContent } from './get-metric-with-data-source';

type MetricFilter = NonNullable<MetricContent['filters']>[number];

const MODES_REQUIRING_AND = new Set<MetricFilter['mode']>([
  'predicate',
  'range',
  'in_list',
  'join_predicate',
  'qualify',
  'having',
]);

const LIST_TYPES = new Set<MetricFilter['type']>(['string_list', 'number_list']);

const RANGE_TYPES = new Set<MetricFilter['type']>(['daterange', 'timestamp_range']);

export function compileSqlWithDefaults(metric: MetricContent, filterValues?: Record<string, unknown>): string {
  const filters = metric.filters ?? [];

  const filterMap = new Map<string, MetricFilter>();
  for (const filter of filters) {
    if (filterMap.has(filter.key)) {
      throw new Error(`Duplicate filter definition for key '${filter.key}'.`);
    }
    filterMap.set(filter.key, filter);
  }

  const tokenRegex = /{{([a-zA-Z0-9_-]+)}}/g;
  const sql = metric.sql;
  let compiledSql = '';
  let lastIndex = 0;
  const usedFilters = new Set<string>();

  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: regex.exec() pattern requires assignment in while condition
  while ((match = tokenRegex.exec(sql)) !== null) {
    const tokenStart = match.index;
    const tokenEnd = tokenRegex.lastIndex;
    const key = match[1];
    if (!key) {
      throw new Error(`Invalid token format detected in SQL`);
    }
    compiledSql += sql.slice(lastIndex, tokenStart);

    const filter = filterMap.get(key);
    if (!filter) {
      throw new Error(`SQL references token '{{${key}}}' but no filter with that key is defined.`);
    }
    usedFilters.add(key);

    // Use user-provided value if available, otherwise use default
    const value = filterValues && key in filterValues ? filterValues[key] : filter.default;

    const shouldApply = shouldApplyDefault(filter, value);
    if (!shouldApply) {
      if (filter.required) {
        throw new Error(
          `Filter '${filter.key}' is required but no value was provided.`
        );
      }
      // Remove token entirely when no value is supplied.
      lastIndex = tokenEnd;
      continue;
    }

    const indent = detectIndentation(sql, tokenStart);
    const fragment = renderFragment(filter, value);
    const formattedFragment = fragment.trim().length === 0 ? '' : applyIndent(fragment, indent);
    compiledSql += formattedFragment;
    lastIndex = tokenEnd;
  }

  compiledSql += sql.slice(lastIndex);

  // Ensure no leftover tokens remain
  if (tokenRegex.test(compiledSql)) {
    throw new Error(
      'Unresolved filter tokens remain in the SQL. Make sure every token has a filter definition and defaults when needed.'
    );
  }

  // Ensure every filter maps to a token
  for (const filter of filterMap.values()) {
    if (!usedFilters.has(filter.key)) {
      throw new Error(`Filter '${filter.key}' does not appear in the SQL as '{{${filter.key}}}'.`);
    }
  }

  return compiledSql;
}

function shouldApplyDefault(_filter: MetricFilter, value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  return true;
}

function renderFragment(filter: MetricFilter, value: unknown): string {
  const needsLeadingAnd = filter.needsLeadingAnd ?? MODES_REQUIRING_AND.has(filter.mode);

  switch (filter.mode) {
    case 'predicate':
    case 'join_predicate':
    case 'qualify':
    case 'having': {
      if (!filter.column.trim()) {
        throw new Error(`Filter '${filter.key}' must define a column for mode '${filter.mode}'.`);
      }
      const op = filter.op ?? '=';
      const literal = toSqlLiteral(value, filter.type);
      const condition = `${filter.column} ${op} ${literal}`;
      return needsLeadingAnd ? `AND ${condition}` : condition;
    }
    case 'range': {
      if (!filter.column.trim()) {
        throw new Error(`Filter '${filter.key}' must define a column for mode 'range'.`);
      }
      if (!Array.isArray(value) || value.length < 2) {
        throw new Error(
          `Filter '${filter.key}' range defaults must be an array with start and end values.`
        );
      }
      const [start, end] = value as [unknown, unknown];
      const clauses: string[] = [];
      if (start !== undefined && start !== null) {
        clauses.push(
          `${filter.column} >= ${toSqlLiteral(start, getRangeElementType(filter.type))}`
        );
      }
      if (end !== undefined && end !== null) {
        clauses.push(`${filter.column} < ${toSqlLiteral(end, getRangeElementType(filter.type))}`);
      }
      if (clauses.length === 0) {
        return '';
      }
      const fragment = clauses.join(' AND ');
      return needsLeadingAnd ? `AND ${fragment}` : fragment;
    }
    case 'in_list': {
      if (!filter.column.trim()) {
        throw new Error(`Filter '${filter.key}' must define a column for mode 'in_list'.`);
      }
      const values = Array.isArray(value) ? value : [value];
      if (values.length === 0) {
        return '';
      }
      const elementType = getListElementType(filter.type);
      const literals = values.map((entry) => toSqlLiteral(entry, elementType));
      const fragment = `${filter.column} IN (${literals.join(', ')})`;
      return needsLeadingAnd ? `AND ${fragment}` : fragment;
    }
    case 'order_by_item': {
      return toRawSql(value);
    }
    case 'partition_by': {
      const parts = Array.isArray(value) ? value : [value];
      return parts.map((part) => String(part)).join(', ');
    }
    case 'select_expr':
    case 'limit': {
      return toRawSql(value);
    }
    case 'predicate_switch':
    case 'predicate_complex': {
      return toRawSql(value);
    }
    case 'value': {
      // Just replace the token with the literal value
      // Used for cases like EXTRACT(YEAR FROM {{date}})
      return toSqlLiteral(value, filter.type);
    }
    default: {
      const exhaustive: never = filter.mode;
      return exhaustive;
    }
  }
}

function detectIndentation(sql: string, tokenStart: number): string {
  let newlineIndex = tokenStart - 1;
  while (newlineIndex >= 0 && sql[newlineIndex] !== '\n' && sql[newlineIndex] !== '\r') {
    newlineIndex -= 1;
  }

  let indent = '';
  for (let i = newlineIndex + 1; i < tokenStart; i += 1) {
    const char = sql[i];
    if (char === ' ' || char === '\t') {
      indent += char;
    } else {
      indent = '';
      break;
    }
  }

  return indent;
}

function toSqlLiteral(value: unknown, type: MetricFilter['type']): string {
  if (value === undefined || value === null) {
    throw new Error('Filter defaults must be finite values.');
  }

  switch (type) {
    case 'number':
    case 'number_list': {
      const numeric = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(numeric)) {
        throw new Error(`Expected numeric default value but received '${value}'.`);
      }
      return String(numeric);
    }
    case 'boolean': {
      if (typeof value !== 'boolean') {
        throw new Error(`Expected boolean default value but received '${value}'.`);
      }
      return value ? 'TRUE' : 'FALSE';
    }
    case 'date':
    case 'timestamp':
    case 'string':
    case 'string_list':
    case 'daterange':
    case 'timestamp_range': {
      return `'${escapeSingleQuotes(String(value))}'`;
    }
    default: {
      return `'${escapeSingleQuotes(String(value))}'`;
    }
  }
}

function getListElementType(type: MetricFilter['type']): MetricFilter['type'] {
  if (!LIST_TYPES.has(type)) {
    return type;
  }
  return type === 'string_list' ? 'string' : 'number';
}

function getRangeElementType(type: MetricFilter['type']): MetricFilter['type'] {
  if (RANGE_TYPES.has(type)) {
    return type === 'timestamp_range' ? 'timestamp' : 'date';
  }
  return type;
}

function toRawSql(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(', ');
  }
  if (typeof value === 'object') {
    throw new Error('Defaults for this filter mode must be strings or numbers.');
  }
  return String(value);
}

function applyIndent(fragment: string, indent: string): string {
  if (!indent) {
    return fragment;
  }
  const lines = fragment.split('\n');
  return lines
    .map((line, index) => {
      if (line.trim().length === 0) {
        return '';
      }
      return index === 0 ? line : `${indent}${line}`;
    })
    .join('\n');
}

function escapeSingleQuotes(value: string): string {
  return value.replace(/'/g, "''");
}
