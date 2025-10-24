import { describe, expect, it } from 'vitest';
import { getDuckDBSimpleType, mapDuckDBType } from './duckdb';

describe('duckdb.test.ts', () => {
  describe('mapDuckDBType', () => {
    it('should map integer types correctly', () => {
      expect(mapDuckDBType('TINYINT')).toBe('smallint');
      expect(mapDuckDBType('SMALLINT')).toBe('smallint');
      expect(mapDuckDBType('INTEGER')).toBe('integer');
      expect(mapDuckDBType('INT')).toBe('integer');
      expect(mapDuckDBType('BIGINT')).toBe('bigint');
      expect(mapDuckDBType('HUGEINT')).toBe('hugeint');
    });

    it('should map unsigned integer types correctly', () => {
      expect(mapDuckDBType('UTINYINT')).toBe('utinyint');
      expect(mapDuckDBType('USMALLINT')).toBe('usmallint');
      expect(mapDuckDBType('UINTEGER')).toBe('uinteger');
      expect(mapDuckDBType('UBIGINT')).toBe('ubigint');
    });

    it('should map floating-point types correctly', () => {
      expect(mapDuckDBType('FLOAT')).toBe('float');
      expect(mapDuckDBType('REAL')).toBe('float');
      expect(mapDuckDBType('DOUBLE')).toBe('double');
      expect(mapDuckDBType('DOUBLE PRECISION')).toBe('double');
    });

    it('should map decimal types correctly', () => {
      expect(mapDuckDBType('DECIMAL')).toBe('decimal');
      expect(mapDuckDBType('NUMERIC')).toBe('decimal');
      expect(mapDuckDBType('DECIMAL(18,2)')).toBe('decimal');
    });

    it('should map string types correctly', () => {
      expect(mapDuckDBType('VARCHAR')).toBe('varchar');
      expect(mapDuckDBType('CHAR')).toBe('char');
      expect(mapDuckDBType('TEXT')).toBe('text');
      expect(mapDuckDBType('STRING')).toBe('text');
    });

    it('should map boolean type correctly', () => {
      expect(mapDuckDBType('BOOLEAN')).toBe('boolean');
      expect(mapDuckDBType('BOOL')).toBe('boolean');
    });

    it('should map date/time types correctly', () => {
      expect(mapDuckDBType('DATE')).toBe('date');
      expect(mapDuckDBType('TIME')).toBe('time');
      expect(mapDuckDBType('TIMESTAMP')).toBe('timestamp');
      expect(mapDuckDBType('TIMESTAMP WITH TIME ZONE')).toBe('timestamptz');
      expect(mapDuckDBType('TIMESTAMPTZ')).toBe('timestamptz');
      expect(mapDuckDBType('INTERVAL')).toBe('interval');
    });

    it('should map binary types correctly', () => {
      expect(mapDuckDBType('BLOB')).toBe('bytea');
      expect(mapDuckDBType('BYTEA')).toBe('bytea');
    });

    it('should map complex types correctly', () => {
      expect(mapDuckDBType('ARRAY')).toBe('array');
      expect(mapDuckDBType('LIST')).toBe('array');
      expect(mapDuckDBType('MAP')).toBe('json');
      expect(mapDuckDBType('STRUCT')).toBe('json');
      expect(mapDuckDBType('UNION')).toBe('json');
    });

    it('should map special types correctly', () => {
      expect(mapDuckDBType('JSON')).toBe('json');
      expect(mapDuckDBType('UUID')).toBe('uuid');
      expect(mapDuckDBType('ENUM')).toBe('varchar');
    });

    it('should handle parameterized types', () => {
      expect(mapDuckDBType('VARCHAR(255)')).toBe('varchar');
      expect(mapDuckDBType('CHAR(10)')).toBe('char');
      expect(mapDuckDBType('DECIMAL(18,4)')).toBe('decimal');
    });

    it('should handle lowercase input', () => {
      expect(mapDuckDBType('integer')).toBe('integer');
      expect(mapDuckDBType('varchar')).toBe('varchar');
      expect(mapDuckDBType('timestamp')).toBe('timestamp');
      expect(mapDuckDBType('boolean')).toBe('boolean');
    });

    it('should handle mixed case input', () => {
      expect(mapDuckDBType('Integer')).toBe('integer');
      expect(mapDuckDBType('VarChar')).toBe('varchar');
      expect(mapDuckDBType('TimeStamp')).toBe('timestamp');
    });

    it('should handle unknown types', () => {
      expect(mapDuckDBType('UNKNOWN_TYPE')).toBe('text');
      expect(mapDuckDBType('')).toBe('text');
    });

    it('should handle non-string input', () => {
      expect(mapDuckDBType(123)).toBe('text');
    });

    it('should handle complex parameterized types', () => {
      expect(mapDuckDBType('LIST<INTEGER>')).toBe('array');
      expect(mapDuckDBType('MAP<VARCHAR, INTEGER>')).toBe('json');
      expect(mapDuckDBType('STRUCT<a INTEGER, b VARCHAR>')).toBe('json');
    });
  });

  describe('getDuckDBSimpleType', () => {
    it('should categorize integer types as number', () => {
      expect(getDuckDBSimpleType('smallint')).toBe('number');
      expect(getDuckDBSimpleType('integer')).toBe('number');
      expect(getDuckDBSimpleType('bigint')).toBe('number');
      expect(getDuckDBSimpleType('hugeint')).toBe('number');
      expect(getDuckDBSimpleType('utinyint')).toBe('number');
      expect(getDuckDBSimpleType('usmallint')).toBe('number');
      expect(getDuckDBSimpleType('uinteger')).toBe('number');
      expect(getDuckDBSimpleType('ubigint')).toBe('number');
    });

    it('should categorize floating-point types as number', () => {
      expect(getDuckDBSimpleType('float')).toBe('number');
      expect(getDuckDBSimpleType('double')).toBe('number');
      expect(getDuckDBSimpleType('decimal')).toBe('number');
    });

    it('should categorize date/time types as date', () => {
      expect(getDuckDBSimpleType('date')).toBe('date');
      expect(getDuckDBSimpleType('time')).toBe('date');
      expect(getDuckDBSimpleType('timestamp')).toBe('date');
      expect(getDuckDBSimpleType('timestamptz')).toBe('date');
      expect(getDuckDBSimpleType('interval')).toBe('date');
    });

    it('should categorize string types as text', () => {
      expect(getDuckDBSimpleType('varchar')).toBe('text');
      expect(getDuckDBSimpleType('char')).toBe('text');
      expect(getDuckDBSimpleType('text')).toBe('text');
    });

    it('should categorize boolean as text', () => {
      expect(getDuckDBSimpleType('boolean')).toBe('text');
    });

    it('should categorize binary types as text', () => {
      expect(getDuckDBSimpleType('bytea')).toBe('text');
    });

    it('should categorize complex types as text', () => {
      expect(getDuckDBSimpleType('array')).toBe('text');
      expect(getDuckDBSimpleType('json')).toBe('text');
      expect(getDuckDBSimpleType('uuid')).toBe('text');
    });

    it('should handle uppercase input', () => {
      expect(getDuckDBSimpleType('INTEGER')).toBe('number');
      expect(getDuckDBSimpleType('VARCHAR')).toBe('text');
      expect(getDuckDBSimpleType('TIMESTAMP')).toBe('date');
    });
  });
});
